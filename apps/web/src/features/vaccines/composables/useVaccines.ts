import { ref } from 'vue'
import { useNotify } from '@/composables/useNotify'
import type { CreateVaccine, Vaccine } from '@armali/schemas'
import { vaccineApi } from '../api'

export function useVaccines() {
  const notify = useNotify()

  const vaccines = ref<Vaccine[]>([])
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      vaccines.value = await vaccineApi.getAll()
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      loading.value = false
    }
  }

  async function createVaccine(payload: CreateVaccine) {
    await vaccineApi.create(payload)
    notify.success('Vaccin créé')
    await load()
  }

  async function updateVaccine(id: string, payload: CreateVaccine) {
    await vaccineApi.update({ id, ...payload })
    notify.success('Vaccin mis à jour')
    await load()
  }

  async function deleteVaccine(id: string) {
    await vaccineApi.remove({ id })
    notify.success('Vaccin supprimé')
    await load()
  }

  return { vaccines, loading, load, createVaccine, updateVaccine, deleteVaccine }
}
