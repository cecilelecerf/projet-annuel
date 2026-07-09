import { ref, computed } from 'vue'
import { useNotify } from '@/composables/useNotify'
import type { ClinicId, Pet, Race } from '@armali/schemas'
import { petApi } from '../api'
import { clinicApi } from '@/features/clinics/clinic.api'
import { raceApi } from '@/features/races/api'
import { match } from 'ts-pattern'

type VeterinarianLink = { type: 'veterinarian' }
type ClinicLink = { type: 'clinic'; clinicId: ClinicId }
export function useClinicPets({ data }: { data: VeterinarianLink | ClinicLink }) {
  const notify = useNotify()

  const allPets = ref<Pet[]>([])
  const selectedPetIds = ref<string[]>([])
  const racesByPet = ref<Record<string, Race[]>>({})
  const loadingRaces = ref<Record<string, boolean>>({})
  const loading = ref(false)
  const saving = ref(false)

  const editing = ref(false)

  const acceptedPets = computed(() =>
    allPets.value.filter((p) => selectedPetIds.value.includes(p.id)),
  )

  async function load() {
    loading.value = true
    try {
      const all = await petApi.getAll()
      const accepted = await match(data)
        .with(
          { type: 'veterinarian' },
          async () => await clinicApi.pets.getAcceptedPets('clinicId' as ClinicId),
        )
        .with({ type: 'clinic' }, async (d) => await clinicApi.pets.getAcceptedPets(d.clinicId))
        .exhaustive()
      allPets.value = all
      selectedPetIds.value = accepted.map((p) => p.id)
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      loading.value = false
    }
  }

  async function loadRacesForPet(petId: string) {
    if (racesByPet.value[petId]) return
    loadingRaces.value[petId] = true
    try {
      racesByPet.value[petId] = await raceApi.getByPetId(petId)
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Erreur de chargement des races')
    } finally {
      loadingRaces.value[petId] = false
    }
  }

  function startEdit() {
    editing.value = true
  }

  function cancelEdit() {
    editing.value = false
    load() // repart des vraies données enregistrées
  }

  function removePet(petId: string) {
    selectedPetIds.value = selectedPetIds.value.filter((id) => id !== petId)
  }

  function addPet(petId: string) {
    if (!selectedPetIds.value.includes(petId)) {
      selectedPetIds.value.push(petId)
      loadRacesForPet(petId)
    }
  }

  async function save() {
    saving.value = true
    try {
      const accepted = await match(data)
        .with(
          { type: 'veterinarian' },
          async () =>
            await clinicApi.pets.setAcceptedPets({
              clinicId: 'z' as ClinicId,
              petIds: selectedPetIds.value,
            }),
        )
        .with(
          { type: 'clinic' },
          async (d) =>
            await clinicApi.pets.setAcceptedPets({
              clinicId: d.clinicId,
              petIds: selectedPetIds.value,
            }),
        )
        .exhaustive()

      selectedPetIds.value = accepted.map((p) => p.id)
      notify.success('Espèces acceptées mises à jour')
      editing.value = false
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    } finally {
      saving.value = false
    }
  }

  return {
    allPets,
    acceptedPets,
    selectedPetIds,
    racesByPet,
    loadingRaces,
    loading,
    saving,
    editing,
    load,
    loadRacesForPet,
    startEdit,
    cancelEdit,
    removePet,
    addPet,
    save,
  }
}
