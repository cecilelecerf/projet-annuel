import { ref, computed, type Ref } from 'vue'
import type {
  Act,
  ActType,
  CreateFreeMedicalHistory,
  AnimalId,
  MedicalHistoryMeta,
} from '@armali/schemas'

function defaultForm(animalId: AnimalId): Partial<CreateFreeMedicalHistory> {
  return {
    animalId,
    performedAt: new Date(),
    notes: '',
    actId: undefined,
    type: 'free',
  }
}

export function useFreeMedicalHistoryForm(animalId: AnimalId, acts: Ref<Act[]>) {
  const form = ref<Partial<CreateFreeMedicalHistory>>(defaultForm(animalId))
  const selectedType = ref<ActType | null>(null)

  const actsForSelectedType = computed(() => {
    if (!selectedType.value) return []
    return acts.value.filter((a) => a.type === selectedType.value)
  })

  function reset() {
    selectedType.value = null
    form.value = defaultForm(animalId)
  }

  function populateFromAct(source: MedicalHistoryMeta) {
    selectedType.value = source.act?.type ?? null
    form.value = {
      animalId,
      performedAt: new Date(source.performedAt),
      notes: source.notes ?? '',
      actId: source.actId ?? undefined,
      type: 'free',
    }
  }

  function onTypeChange() {
    form.value.actId = undefined
  }

  return {
    form,
    selectedType,
    actsForSelectedType,
    reset,
    populateFromAct,
    onTypeChange,
  }
}
