import { http } from '@/lib/api'
import {
  ownedPetMetaSchema,
  ownedPetWithRaceMeta,
  type OwnedPet,
  type UserId,
} from '@armali/schemas'

export const ownedPetApi = {
  getAllByUser: async (userId: UserId): Promise<OwnedPet[]> => {
    const data = await http.get(`/owned-pets/user/${userId}`)
    return ownedPetWithRaceMeta.array().parse(data)
  },
}
