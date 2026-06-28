import { http } from '@/lib/api'
import { clinicActSchema, type ClinicId } from '@armali/schemas'

export const actsApi = {
  clinicActs: {
    getByClinic: async (clinicId: ClinicId) => {
      const data = await http.get(`/acts/clinic/${clinicId}`)
      return clinicActSchema.array().parse(data)
    },
  },
}
