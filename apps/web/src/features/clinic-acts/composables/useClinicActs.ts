import { ref } from 'vue'
import { useNotify } from '@/composables/useNotify'
import type { ActId, ClinicAct, ClinicActId, ClinicId, CreateClinicAct } from '@armali/schemas'
import { clinicActApi } from '../clinic-act.api'

export function useClinicActs(clinicId: ClinicId) {
  const notify = useNotify()

  const clinicActs = ref<ClinicAct[]>([])
  const loading = ref(false)

  async function load(clinicId: ClinicId) {
    loading.value = true
    try {
      clinicActs.value = await clinicActApi.getByClinic(clinicId)
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      loading.value = false
    }
  }

  async function createClinicAct(payload: CreateClinicAct) {
    await clinicActApi.create(payload, clinicId)
    notify.success('Tarif ajouté')
    await load(clinicId)
  }

  async function updateClinicAct(id: ActId, payload: CreateClinicAct) {
    await clinicActApi.update({ id, clinicId, ...payload })
    notify.success('Tarif mis à jour')
    await load(clinicId)
  }

  async function deleteClinicAct(id: ActId) {
    await clinicActApi.remove({ id, clinicId })
    notify.success('Tarif supprimé')
    await load(clinicId)
  }

  return { clinicActs, loading, load, createClinicAct, updateClinicAct, deleteClinicAct }
}
