import type { UserRole } from '@armali/schemas'

type StaffPageTexts = {
  title: string
  description: string
}

const STAFF_PAGE_TEXTS: Partial<Record<UserRole, StaffPageTexts>> = {
  DIRECTOR: {
    title: 'Gestion du personnel',
    description: 'Gérez les membres de votre clinique.',
  },

  REFERENT: {
    title: 'Gestion des référents et collaborateurs',
    description:
      'Consultez les membres de votre équipe et gérez les collaborateurs de votre clinique.',
  },

  SECRETARY: {
    title: 'Équipe administrative',
    description: 'Consultez les membres administratifs de votre clinique.',
  },

  VETERINARIAN: {
    title: 'Équipe vétérinaire',
    description: 'Consultez les vétérinaires et membres de votre équipe médicale.',
  },
}

const DEFAULT_STAFF_PAGE_TEXTS: StaffPageTexts = {
  title: 'Gestion du personnel',
  description: 'Consultez et créez des comptes pour les membres de votre clinique',
}

export function getStaffPageTexts(role?: UserRole): StaffPageTexts {
  return role && STAFF_PAGE_TEXTS[role] ? STAFF_PAGE_TEXTS[role] : DEFAULT_STAFF_PAGE_TEXTS
}
