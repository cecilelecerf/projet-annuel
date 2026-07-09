import { http } from '@/lib/api'
import {
  petSchema,
  specialitySchema,
  type VeterinarianId,
  type Pet,
  type Speciality,
  type SpecialityId,
} from '@armali/schemas'

export const veterinarianApi = {
  specialities: {
    getAcceptedSpecialities: async ({
      veterinarianId,
    }: {
      veterinarianId: VeterinarianId
    }): Promise<Speciality[]> => {
      const data = await http.get(`/veterinarians/${veterinarianId}/specialities`)
      return specialitySchema.array().parse(data)
    },

    setAcceptedSpecialities: async ({
      veterinarianId,
      specialityIds,
    }: {
      specialityIds: SpecialityId[]
      veterinarianId: VeterinarianId
    }): Promise<Speciality[]> => {
      const data = await http.patch(`/veterinarians/${veterinarianId}/specialities`, {
        specialityIds,
      })
      return specialitySchema.array().parse(data)
    },
  },

  pets: {
    getAcceptedPets: (veterinarianId: VeterinarianId): Promise<Pet[]> =>
      http
        .get(`/veterinarians/${veterinarianId}/pets`)
        .then((data) => petSchema.array().parse(data)),

    setAcceptedPets: ({
      veterinarianId,
      petIds,
    }: {
      veterinarianId: VeterinarianId
      petIds: string[]
    }): Promise<Pet[]> =>
      http
        .patch(`/veterinarians/${veterinarianId}/pets`, { petIds })
        .then((data) => petSchema.array().parse(data)),
  },
}
