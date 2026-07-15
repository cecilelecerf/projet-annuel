terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  alias      = "dr"
  region     = "eu-west-3"
  access_key = var.aws_admin_access_key
  secret_key = var.aws_admin_secret_key
}

resource "aws_s3_bucket" "backups_dr" {
  provider = aws.dr
  bucket   = "armali-backups-dr"
}

resource "aws_s3_bucket_versioning" "backups_dr" {
  provider = aws.dr
  bucket   = aws_s3_bucket.backups_dr.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_object_lock_configuration" "backups_dr" {
  provider = aws.dr
  bucket   = aws_s3_bucket.backups_dr.id
  rule {
    default_retention {
      mode = "GOVERNANCE"
      days = 30
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups_dr" {
  provider = aws.dr
  bucket   = aws_s3_bucket.backups_dr.id
  rule {
    id     = "rotation"
    status = "Enabled"
    filter {}
    transition {
      days          = 30
      storage_class = "GLACIER_IR"
    }
    expiration {
      days = 180
    }
  }
}

# Utilisateur IAM dédié, droits minimaux (écriture + lecture, PAS de suppression)
resource "aws_iam_user" "backup_writer" {
  provider = aws.dr
  name     = "armali-backup-writer"
}

resource "aws_iam_access_key" "backup_writer" {
  provider = aws.dr
  user     = aws_iam_user.backup_writer.name
}

resource "aws_iam_user_policy" "backup_write_only" {
  provider = aws.dr
  name     = "armali-backup-write-only"
  user     = aws_iam_user.backup_writer.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject", "s3:ListBucket", "s3:GetObject"]
      Resource = [
        aws_s3_bucket.backups_dr.arn,
        "${aws_s3_bucket.backups_dr.arn}/*"
      ]
    }]
  })
}

output "backup_writer_access_key" {
  value     = aws_iam_access_key.backup_writer.id
  sensitive = true
}

output "backup_writer_secret_key" {
  value     = aws_iam_access_key.backup_writer.secret
  sensitive = true
}