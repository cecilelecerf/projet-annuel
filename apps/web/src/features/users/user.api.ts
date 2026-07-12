import { http } from '@/lib/api'
import {
  baseUserSchema,
  confirmUploadSchema,
  initiateImageUploadSchema,
  uploadResponseSchema,
  userSchema,
  type InitiateImageUploadInput,
  type User,
  type UserId,
  type UserRole,
} from '@armali/schemas'

export const usersApi = {
  getUsersByRole: async ({ roles }: { roles: (UserRole | 'STAFF')[] }): Promise<User[]> => {
    const query = new URLSearchParams()
    roles.forEach((role) => query.append('role', role))

    const data = await http.get(`/users?${query.toString()}`)
    return userSchema.array().parse(data)
  },
  get: async ({ id }: { id: UserId }): Promise<User> => {
    const data = await http.get(`/users/${id}`)
    return userSchema.parse(data)
  },

  avatar: {
    upload: async ({ file }: { file: File }) => {
      const payload: InitiateImageUploadInput = initiateImageUploadSchema.parse({
        mimeType: file.type,
        size: file.size,
      })

      // 1. Demander une URL S3
      const { uploadUrl, fileId } = await http
        .post('/users/me/avatar/upload', payload)
        .then((data) => uploadResponseSchema.parse(data))

      // 2. Upload direct vers S3
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      return { fileId }
    },

    confirm: async ({ fileId }: { fileId: string }) => {
      const body = confirmUploadSchema.parse({ fileId })
      const data = await http.patch('/users/me/avatar/confirm', body)
      return baseUserSchema.parse(data)
    },
  },
}
