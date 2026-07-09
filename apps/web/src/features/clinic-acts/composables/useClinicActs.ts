import { ref } from 'vue'
import { useNotify } from '@/composables/useNotify'
import type { ClinicAct, ClinicId, CreateClinicAct } from '@armali/schemas'
import { clinicActApi } from '../clinic-act.api'

export function useClinicActs() {
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

  async function createClinicAct(clinicId: ClinicId, payload: CreateClinicAct) {
    await clinicActApi.create(payload)
    notify.success('Tarif ajouté')
    await load(clinicId)
  }

  async function updateClinicAct(clinicId: ClinicId, id: string, payload: CreateClinicAct) {
    await clinicActApi.update({ id, ...payload })
    notify.success('Tarif mis à jour')
    await load(clinicId)
  }

  async function deleteClinicAct(clinicId: ClinicId, id: string) {
    await clinicActApi.remove({ id })
    notify.success('Tarif supprimé')
    await load(clinicId)
  }

  return { clinicActs, loading, load, createClinicAct, updateClinicAct, deleteClinicAct }
}
