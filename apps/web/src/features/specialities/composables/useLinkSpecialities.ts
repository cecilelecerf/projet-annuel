import { ref, computed } from 'vue'
import { useNotify } from '@/composables/useNotify'
import type { ClinicId, Speciality, SpecialityId } from '@armali/schemas'
import { specialityApi } from '@/features/specialities/speciality.api'
import { clinicApi } from '@/features/clinics/clinic.api'

export function useClinicSpecialities(clinicId: ClinicId) {
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
      const [all, accepted] = await Promise.all([
        specialityApi.getAll(),
        clinicApi.specialities.getAcceptedSpecialities({ clinicId }),
      ])
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
      const accepted = await clinicApi.specialities.setAcceptedSpecialities({
        clinicId,
        specialityIds: selectedIds.value,
      })
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
