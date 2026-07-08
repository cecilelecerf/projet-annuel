import { ref } from 'vue'
import { useNotify } from '@/composables/useNotify'
import type { Act, CreateAct } from '@armali/schemas'
import { actApi } from '../act.api'

export function useActs() {
  const notify = useNotify()

  const acts = ref<Act[]>([])
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      acts.value = await actApi.getAll()
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      loading.value = false
    }
  }

  async function createAct(payload: CreateAct) {
    await actApi.create(payload)
    notify.success('Acte créé')
    await load()
  }

  async function updateAct(id: string, payload: CreateAct) {
    await actApi.update({ id, ...payload })
    notify.success('Acte mis à jour')
    await load()
  }

  async function deleteAct(id: string) {
    await actApi.remove({ id })
    notify.success('Acte supprimé')
    await load()
  }

  return { acts, loading, load, createAct, updateAct, deleteAct }
}
