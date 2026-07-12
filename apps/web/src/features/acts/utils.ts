import type { ActType } from '@armali/schemas'

export type ActBadgeColor = 'purple' | 'pink' | 'teal' | 'yellow' | 'orange' | 'indigo'

const ACT_TYPE_BADGE: Record<ActType, ActBadgeColor> = {
  CONSULTATION: 'indigo',
  VACCINATION: 'teal',
  SURGERY: 'purple',
  HOSPITALIZATION: 'orange',
  IMAGING: 'purple',
  ANALYSIS: 'pink',
  NURSING: 'yellow',
}

export function getActTypeBadge(type: ActType): ActBadgeColor {
  return ACT_TYPE_BADGE[type]
}
