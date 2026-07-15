terraform {
  required_version = ">= 1.5"

  required_providers {
    ovh = {
      source  = "ovh/ovh"
      version = "~> 2.1"
    }
  }

  backend "s3" {
    bucket                      = "armali-backups-local"
    key                         = "terraform.tfstate"
    region                      = "gra"
    endpoints                   = { s3 = "https://s3.gra.io.cloud.ovh.net" }
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum             = true  
    use_path_style               = true 
  }
}

provider "ovh" {
  endpoint = var.ovh_endpoint
}

resource "ovh_cloud_project_storage" "backup_bucket" {
  service_name = var.ovh_project_id
  region_name  = var.ovh_region
  name         = var.bucket_name

  versioning = {
    status = "enabled"
  }

  encryption = {
    sse_algorithm = "AES256"
  }
}
