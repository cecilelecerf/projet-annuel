import { ref } from 'vue'
import type { Clinic, ClinicId, StaffMember } from '@armali/schemas'
import { clinicApi } from '@/features/clinics/clinic.api'
import { staffApi } from '@/features/staffs/staff.api'

// TODO: staff est chargé un cabinet à la fois avec la même méthode utilisée
// dans le drawer de meeting (getStaffByClinicRole) — un véto multi-cliniques
// voit donc bien chaque clinique séparément, contrairement à l'ancien code
// qui traitait /clinics/me et /clinics/staff comme des objets uniques.
export function useProfileClinicData() {
  const clinics = ref<Clinic[]>([])
  const staffByClinic = ref<Record<ClinicId, StaffMember[]>>({})
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      clinics.value = await clinicApi.getMine()
      const results = await Promise.all(
        clinics.value.map((c) =>
          staffApi.getAllByClinic({ clinicId: c.id }).then((staff) => [c.id, staff] as const),
        ),
      )
      staffByClinic.value = Object.fromEntries(results)
    } finally {
      loading.value = false
    }
  }

  return { clinics, staffByClinic, loading, load }
}
