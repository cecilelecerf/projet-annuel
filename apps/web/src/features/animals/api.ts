import { http } from '@/lib/api'
import {
  animalDetailSchema,
  animalMetaSchema,
  animalSchema,
  animalWithRaceMetaSchema,
  baseUserSchema,
  confirmUploadSchema,
  initiateImageUploadSchema,
  uploadResponseSchema,
  vaccineMetaSchema,
  type AnimalDetail,
  type AnimalId,
  type AnimalWithRaceMeta,
  type ClinicId,
  type CreateAnimal,
  type InitiateImageUploadInput,
  type UserId,
  type VeterinarianId,
} from '@armali/schemas'

export const animalApi = {
  getAll: async (): Promise<AnimalWithRaceMeta[]> => {
    const data = await http.get(`/animals`)
    return animalWithRaceMetaSchema.array().parse(data)
  },

  getAllByClinic: async (clinicId: ClinicId) => {
    const data = await http.get(`/clinics/${clinicId}/animals`)
    return animalMetaSchema.array().parse(data)
  },
  getAllByVeterinarian: async (veterinarianId: VeterinarianId) => {
    const data = await http.get(`/veterinarians/${veterinarianId}/animals`)
    return animalMetaSchema.array().parse(data)
  },
  getAllByUser: async (userId: UserId) => {
    const data = await http.get(`/users/${userId}/animals`)
    return animalMetaSchema.array().parse(data)
  },
  get: async (id: AnimalId): Promise<AnimalDetail> => {
    const data = await http.get(`/animals/${id}`)
    return animalDetailSchema.parse(data)
  },
  getVaccines: async (id: AnimalId) => {
    const data = await http.get(`/animals/${id}/vaccines`)
    return vaccineMetaSchema.array().parse(data)
  },
  create: async (payload: CreateAnimal) => {
    return http.post(`/animals`, payload).then((data) => animalWithRaceMetaSchema.parse(data))
  },
  createByUser: async (userId: UserId, payload: CreateAnimal) => {
    return http.post(`/users/${userId}/animal`, payload).then((data) => animalSchema.parse(data))
  },

  picture: {
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
