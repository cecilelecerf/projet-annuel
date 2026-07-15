output "bucket_name" {
  description = "Nom du bucket créé"
  value       = ovh_cloud_project_storage.backup_bucket.name
}

output "bucket_region" {
  description = "Région du bucket"
  value       = ovh_cloud_project_storage.backup_bucket.region_name
}