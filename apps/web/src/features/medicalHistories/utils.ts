import type { ActType } from '@armali/schemas'

export const actTypeIcon = (type?: ActType) => {
  const icons: Record<string, string> = {
    VACCINATION: 'Syringe',
    SURGERY: 'Scissors',
    HOSPITALIZATION: 'House',
    IMAGING: 'Camera',
    ANALYSIS: 'Odometer',
    NURSING: 'FirstAidKit',
    CONSULTATION: 'ChatDotRound',
  }
  return icons[type ?? ''] ?? 'Document'
}

export const actTypeLabel = (type?: ActType) => {
  const labels: Record<string, string> = {
    VACCINATION: 'Vaccination',
    SURGERY: 'Chirurgie',
    HOSPITALIZATION: 'Hospitalisation',
    IMAGING: 'Imagerie',
    ANALYSIS: 'Analyse',
    NURSING: 'Soins infirmiers',
    CONSULTATION: 'Consultation',
  }
  return labels[type ?? ''] ?? type
}

export const anesthesiaLabel = (type?: string) =>
  ({ LOCAL: 'Locale', GENERAL: 'Générale', SEDATION: 'Sédation' })[type ?? ''] ?? type

export const imagingTypeLabel = (type?: string) =>
  ({ XRAY: 'Radiographie', ULTRASOUND: 'Échographie', SCANNER: 'Scanner', MRI: 'IRM' })[
    type ?? ''
  ] ?? type

export const analysisTypeLabel = (type?: string) =>
  ({
    BLOOD: 'Prise de sang',
    URINE: 'Urine',
    STOOL: 'Selles',
    BIOPSY: 'Biopsie',
    CYTOLOGY: 'Cytologie',
    OTHER: 'Autre',
  })[type ?? ''] ?? type
