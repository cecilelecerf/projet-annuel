import { http } from '@/lib/api'
import { userSchema, type User, type UserRole } from '@armali/schemas'

export const usersApi = {
  getUsersByRole: async (roles: (UserRole | 'STAFF')[]): Promise<User[]> => {
    const data = await http.get(`/users/roles/${roles.map((role) => role.toLowerCase()).join('/')}`)
    return userSchema.array().parse(data)
  },
  get: async (id: string): Promise<User> => {
    const data = await http.get(`/users/${id}`)
    return userSchema.parse(data)
  },
}
