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

  const isPopulating = ref(false)

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
      surgery: source.surgery
        ? {
            anesthesiaType: source.surgery.anesthesiaType,
            duration: source.surgery.duration ?? undefined,
            complications: source.surgery.complications ?? undefined,
            postOpInstructions: source.surgery.postOpInstructions ?? undefined,
          }
        : undefined,
      imaging: source.imaging
        ? {
            imagingType: source.imaging.imagingType,
            bodyPart: source.imaging.bodyPart ?? undefined,
            findings: source.imaging.findings ?? undefined,
          }
        : undefined,
      analysis: source.analysis
        ? {
            analysisType: source.analysis.analysisType,
            status: source.analysis.status,
            laboratory: source.analysis.laboratory ?? undefined,
          }
        : undefined,
      hospitalization: source.hospitalization
        ? {
            admittedAt: new Date(source.hospitalization.admittedAt),
            boxNumber: source.hospitalization.boxNumber ?? undefined,
          }
        : undefined,
    }
    requestAnimationFrame(() => {
      isPopulating.value = false
    })
  }

  function onTypeChange() {
    form.value.actId = undefined
    form.value.surgery = undefined
    form.value.imaging = undefined
    form.value.analysis = undefined
    form.value.hospitalization = undefined
  }

  function onActChange() {
    // Initialise le bon sous-objet selon le type sélectionné, une fois l'acte choisi
    form.value.surgery = selectedType.value === 'SURGERY' ? { anesthesiaType: 'LOCAL' } : undefined
    form.value.imaging = selectedType.value === 'IMAGING' ? { imagingType: 'XRAY' } : undefined
    form.value.analysis =
      selectedType.value === 'ANALYSIS' ? { analysisType: 'BLOOD', status: 'PENDING' } : undefined
    form.value.hospitalization =
      selectedType.value === 'HOSPITALIZATION' ? { admittedAt: new Date() } : undefined
  }

  return {
    form,
    selectedType,
    actsForSelectedType,
    reset,
    populateFromAct,
    onTypeChange,
    onActChange,
  }
}
