import { http } from '@/lib/api'
import { raceSchema, type CreateRace, type Race, type UpdateRace } from '@armali/schemas'

export const raceApi = {
  getByPetId: (petId: string): Promise<Race[]> =>
    http.get(`/pets/${petId}/races`).then((data) => raceSchema.array().parse(data)),

  create: (payload: CreateRace): Promise<Race> =>
    http.post('/races', payload).then((data) => raceSchema.parse(data)),

  update: ({ id, ...payload }: UpdateRace & { id: string }): Promise<Race> =>
    http.patch(`/races/${id}`, payload).then((data) => raceSchema.parse(data)),

  remove: ({ id }: { id: string }): Promise<void> => http.delete(`/races/${id}`),
}
