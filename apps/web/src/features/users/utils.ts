import type { UserId } from '@armali/schemas'

export const toUserId = (id: string) => id as unknown as UserId
