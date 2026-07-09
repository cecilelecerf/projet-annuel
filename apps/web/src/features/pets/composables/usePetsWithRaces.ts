import { ref } from 'vue'
import { useNotify } from '@/composables/useNotify'
import type { Pet, PetId, Race, RaceId } from '@armali/schemas'
import { petApi } from '../api'
import { raceApi } from '@/features/races/api'

export function usePetsWithRaces() {
  const notify = useNotify()

  const pets = ref<Pet[]>([])
  const racesByPet = ref<Record<PetId, Race[]>>({})
  const loadingRaces = ref<Record<PetId, boolean>>({})
  const loading = ref(false)

  async function loadPets() {
    loading.value = true
    try {
      pets.value = await petApi.getAll()
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      loading.value = false
    }
  }

  async function loadRacesForPet(petId: PetId) {
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

  async function refreshRacesForPet(petId: PetId) {
    delete racesByPet.value[petId]
    await loadRacesForPet(petId)
  }

  async function createPet(payload: { name: string; picture?: string | null }) {
    await petApi.create(payload)
    notify.success('Espèce créée')
    await loadPets()
  }

  async function updatePet(id: PetId, payload: { name: string; picture?: string | null }) {
    await petApi.update({ id, ...payload })
    notify.success('Espèce mise à jour')
    await loadPets()
  }

  async function deletePet(id: PetId) {
    await petApi.remove({ id })
    notify.success('Espèce supprimée')
    await loadPets()
  }

  return {
    pets,
    racesByPet,
    loadingRaces,
    loading,
    loadPets,
    loadRacesForPet,
    refreshRacesForPet,
    createPet,
    updatePet,
    deletePet,
  }
}
