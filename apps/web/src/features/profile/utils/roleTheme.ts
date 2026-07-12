import type { UserRole } from '@armali/schemas'

export interface RoleTheme {
  label: string
  avatarBg: string
  avatarColor: string
  badgeBg: string
  badgeColor: string
}

export const ROLE_THEME: Record<UserRole, RoleTheme> = {
  VETERINARIAN: {
    label: 'Vétérinaire',
    avatarBg: 'var(--el-color-success)',
    avatarColor: 'white',
    badgeBg: 'var(--el-color-success-light-9)',
    badgeColor: 'var(--el-color-success)',
  },
  SECRETARY: {
    label: 'Secrétaire',
    avatarBg: 'var(--el-color-yellow)',
    avatarColor: 'white',
    badgeBg: 'var(--el-color-yellow-light-9)',
    badgeColor: 'var(--el-color-yellow)',
  },
  DIRECTOR: {
    label: 'Directeur de clinique',
    avatarBg: 'var(--el-color-danger)',
    avatarColor: 'white',
    badgeBg: 'var(--el-color-danger-light-9)',
    badgeColor: 'var(--el-color-danger)',
  },
  REFERENT: {
    label: 'Référent clinique',
    avatarBg: 'var(--el-color-info)',
    avatarColor: 'white',
    badgeBg: 'var(--el-color-info-light-9)',
    badgeColor: 'var(--el-color-info)',
  },
  CLIENT: {
    label: 'Propriétaire',
    avatarBg: 'var(--el-color-primary)',
    avatarColor: 'white',
    badgeBg: 'var(--el-color-primary-light-9)',
    badgeColor: 'var(--el-color-primary)',
  },
  ADMIN: {
    label: 'Administrateur',
    avatarBg: 'var(--el-text-color-regular)',
    avatarColor: 'white',
    badgeBg: 'var(--el-fill-color)',
    badgeColor: 'var(--el-text-color-regular)',
  },
}
