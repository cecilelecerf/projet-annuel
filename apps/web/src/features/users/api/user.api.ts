import { http } from '@/lib/api'
import { userSchema, type User, type UserId, type UserRole } from '@armali/schemas'

export const usersApi = {
  getUsersByRole: async ({ roles }: { roles: (UserRole | 'STAFF')[] }): Promise<User[]> => {
    const data = await http.get(`/users/roles/${roles.map((role) => role.toLowerCase()).join('/')}`)
    return userSchema.array().parse(data)
  },
  get: async ({ id }: { id: UserId }): Promise<User> => {
    const data = await http.get(`/users/${id}`)
    return userSchema.parse(data)
  },
}
