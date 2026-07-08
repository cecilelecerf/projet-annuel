import { ref, computed } from 'vue'
import type { ClinicAct, CreateClinicAct } from '@armali/schemas'

function emptyForm(): CreateClinicAct {
  return { actId: undefined as never, price: 0 }
}

export function useClinicActForm() {
  const visible = ref(false)
  const mode = ref<'create' | 'edit'>('create')
  const editingId = ref<string | null>(null)
  const form = ref<CreateClinicAct>(emptyForm())

  const title = computed(() => (mode.value === 'create' ? 'Ajouter un tarif' : 'Modifier le tarif'))
  const submitLabel = computed(() => (mode.value === 'create' ? 'Ajouter' : 'Enregistrer'))

  function openCreate() {
    form.value = emptyForm()
    mode.value = 'create'
    editingId.value = null
    visible.value = true
  }

  function openEdit(clinicAct: ClinicAct) {
    form.value = { actId: clinicAct.actId, price: clinicAct.price }
    mode.value = 'edit'
    editingId.value = clinicAct.id
    visible.value = true
  }

  function close() {
    visible.value = false
  }

  return { visible, mode, editingId, form, title, submitLabel, openCreate, openEdit, close }
}
