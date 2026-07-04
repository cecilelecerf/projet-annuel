import { http } from '@/lib/api'
import type {
  StaffList,
  StaffMemberDetail,
  CreateVeterinarianStaff,
  CreateSecretaryStaff,
} from '@armali/schemas'

export const staffApi = {
  getAll: () => http.get<StaffList>('/referent/staff'),
  getById: (id: string) => http.get<StaffMemberDetail>(`/referent/staff/${id}`),
  createVeterinarian: (data: CreateVeterinarianStaff) =>
    http.post('/referent/staff/veterinarians', data),
  createSecretary: (data: CreateSecretaryStaff) =>
    http.post('/referent/staff/secretaries', data),
}