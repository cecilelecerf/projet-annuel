import { http } from '@/lib/api'
import {
  petSchema,
  type ClinicId,
  type CreatePet,
  type Pet,
  type PetId,
  type UpdatePet,
} from '@armali/schemas'

export const petApi = {
  getAll: (): Promise<Pet[]> => http.get('/pets').then((data) => petSchema.array().parse(data)),

  getById: (id: PetId): Promise<Pet> =>
    http.get(`/pets/${id}`).then((data) => petSchema.parse(data)),

  create: (payload: CreatePet): Promise<Pet> =>
    http.post('/pets', payload).then((data) => petSchema.parse(data)),

  update: ({ id, ...payload }: UpdatePet & { id: PetId }): Promise<Pet> =>
    http.patch(`/pets/${id}`, payload).then((data) => petSchema.parse(data)),

  remove: ({ id }: { id: PetId }): Promise<void> => http.delete(`/pets/${id}`),
}
