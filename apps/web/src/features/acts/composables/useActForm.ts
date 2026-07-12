import { ref, computed } from 'vue'
import type { Act, ActType, CreateAct } from '@armali/schemas'

export const ACT_TYPE_LABELS: Record<ActType, string> = {
  VACCINATION: 'Vaccination',
  SURGERY: 'Chirurgie',
  HOSPITALIZATION: 'Hospitalisation',
  IMAGING: 'Imagerie',
  ANALYSIS: 'Analyse',
  NURSING: 'Soins infirmiers',
  CONSULTATION: 'Consultation',
}

export const ACT_TYPE_OPTIONS = Object.entries(ACT_TYPE_LABELS).map(([value, label]) => ({
  value: value as ActType,
  label,
}))

function emptyForm(): CreateAct {
  return {
    name: '',
    description: null,
    type: 'CONSULTATION',
    basePrice: 0,
    vaccineId: null,
  }
}

export function useActForm() {
  const visible = ref(false)
  const mode = ref<'create' | 'edit'>('create')
  const editingId = ref<string | null>(null)
  const form = ref<CreateAct>(emptyForm())

  const title = computed(() => (mode.value === 'create' ? 'Nouvel acte' : "Modifier l'acte"))
  const submitLabel = computed(() => (mode.value === 'create' ? 'Créer' : 'Enregistrer'))

  function openCreate() {
    form.value = emptyForm()
    mode.value = 'create'
    editingId.value = null
    visible.value = true
  }

  function openEdit(act: Act) {
    form.value = {
      name: act.name,
      description: act.description ?? null,
      type: act.type,
      basePrice: act.basePrice,
      vaccineId: act.vaccineId ?? null,
    }
    mode.value = 'edit'
    editingId.value = act.id
    visible.value = true
  }

  function close() {
    visible.value = false
  }

  return { visible, mode, editingId, form, title, submitLabel, openCreate, openEdit, close }
}
