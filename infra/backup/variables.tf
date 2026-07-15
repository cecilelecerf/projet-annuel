variable "ovh_endpoint" {
  description = "Endpoint de l'API OVH selon la région du compte"
  type        = string
  default     = "ovh-eu"
}

variable "ovh_project_id" {
  description = "ID du projet Public Cloud OVH (visible dans le dashboard Public Cloud)"
  type        = string
}

variable "ovh_region" {
  description = "Région OVH pour le stockage (GRA = Gravelines, SBG = Strasbourg, ...)"
  type        = string
  default     = "GRA"
}

variable "bucket_name" {
  description = "Nom du bucket Object Storage pour les backups Armali"
  type        = string
  default     = "armali-backups-local"
}