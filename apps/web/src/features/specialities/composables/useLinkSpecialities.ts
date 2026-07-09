import { ref, computed } from 'vue'
import { useNotify } from '@/composables/useNotify'
import type { ClinicId, Speciality, SpecialityId, VeterinarianId } from '@armali/schemas'
import { specialityApi } from '@/features/specialities/speciality.api'
import { clinicApi } from '@/features/clinics/clinic.api'
import { match } from 'ts-pattern'
import { veterinarianApi } from '@/features/users/veterinarian.api'

export type LinkVeterinarian = { type: 'veterinarian'; veterinarianId: VeterinarianId }
export type LinkClinic = { type: 'clinic'; clinicId: ClinicId }
export function useClinicSpecialities(data: LinkClinic | LinkVeterinarian) {
  const notify = useNotify()

  const allSpecialities = ref<Speciality[]>([])
  const selectedIds = ref<SpecialityId[]>([])
  const loading = ref(false)
  const saving = ref(false)

  const editing = ref(false)

  const acceptedSpecialities = computed(() =>
    allSpecialities.value.filter((s) => selectedIds.value.includes(s.id)),
  )

  async function load() {
    loading.value = true
    try {
      const accepted = await match(data)
        .with(
          { type: 'clinic' },
          async (d) =>
            await clinicApi.specialities.getAcceptedSpecialities({ clinicId: d.clinicId }),
        )
        .with(
          { type: 'veterinarian' },
          async (d) =>
            await veterinarianApi.specialities.getAcceptedSpecialities({
              veterinarianId: d.veterinarianId,
            }),
        )
        .exhaustive()
      const all = await specialityApi.getAll()
      allSpecialities.value = all
      selectedIds.value = accepted.map((s) => s.id)
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      loading.value = false
    }
  }

  function startEdit() {
    editing.value = true
  }

  function cancelEdit() {
    editing.value = false
    load()
  }

  function removeSpeciality(id: SpecialityId) {
    selectedIds.value = selectedIds.value.filter((s) => s !== id)
  }

  function addSpeciality(id: SpecialityId) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value.push(id)
    }
  }

  async function save() {
    saving.value = true
    try {
      const accepted = await match(data)
        .with(
          { type: 'clinic' },
          async (d) =>
            await clinicApi.specialities.setAcceptedSpecialities({
              clinicId: d.clinicId,
              specialityIds: selectedIds.value,
            }),
        )
        .with(
          { type: 'veterinarian' },
          async (d) =>
            await veterinarianApi.specialities.setAcceptedSpecialities({
              veterinarianId: d.veterinarianId,
              specialityIds: selectedIds.value,
            }),
        )
        .exhaustive()

      selectedIds.value = accepted.map((s) => s.id)
      notify.success('Spécialités mises à jour')
      editing.value = false
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    } finally {
      saving.value = false
    }
  }

  return {
    allSpecialities,
    acceptedSpecialities,
    selectedIds,
    loading,
    saving,
    editing,
    load,
    startEdit,
    cancelEdit,
    removeSpeciality,
    addSpeciality,
    save,
  }
}
