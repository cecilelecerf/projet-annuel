import { http } from '@/lib/api'
import { userSchema, type User, type UserRole } from '@armali/schemas'

export const userApi = {
  getUsersByRole: async (role: UserRole): Promise<User[]> => {
    const data = await http.get(`/users/roles/${role.toLowerCase()}`)
    return userSchema.array().parse(data)
  },
}
