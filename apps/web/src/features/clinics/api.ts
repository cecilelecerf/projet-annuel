import { http } from '@/lib/api'
import { clinicSchema, userSchema } from '@armali/schemas'

export const clinicApi = {
  getMine: async () => {
    return await http.get('/clinics/me').then((data) => clinicSchema.array().parse(data))
  },
  staff: async () => {
    return await http.get('/clinics/staff').then((data) => userSchema.array().array().parse(data))
  },
}
