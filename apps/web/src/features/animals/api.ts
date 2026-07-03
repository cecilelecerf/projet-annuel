import { http } from '@/lib/api'
import {
  animalDetailSchema,
  animalWithRaceMetaSchema,
  vaccineMetaSchema,
  type AnimalDetail,
  type AnimalId,
  type AnimalWithRaceMeta,
  type UserId,
} from '@armali/schemas'

export const animalApi = {
  getAllByUser: async (userId: UserId): Promise<AnimalWithRaceMeta[]> => {
    const data = await http.get(`/animals/user/${userId}`)
    return animalWithRaceMetaSchema.array().parse(data)
  },
  get: async (id: AnimalId): Promise<AnimalDetail> => {
    const data = await http.get(`/animals/${id}`)
    return animalDetailSchema.parse(data)
  },
  getVaccines: async (id: AnimalId) => {
    const data = await http.get(`/animals/${id}/vaccines`)
    return vaccineMetaSchema.array().parse(data)
  },
}
