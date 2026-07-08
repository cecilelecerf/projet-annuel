import { ref, computed, type Ref } from 'vue'
import type {
  ActType,
  ClinicAct,
  CreateMettingMedicalHistory,
  MedicalHistoryMeta,
  MeetingId,
} from '@armali/schemas'

function defaultForm(animalMeetingId: MeetingId): Partial<CreateMettingMedicalHistory> {
  return {
    animalMeetingId,
    performedAt: new Date(),
    notes: '',
    priceApplied: undefined,
    clinicActId: undefined,
    type: 'meeting',
  }
}

export function useMeetingActForm(animalMeetingId: MeetingId, clinicActs: Ref<ClinicAct[]>) {
  const form = ref<Partial<CreateMettingMedicalHistory>>(defaultForm(animalMeetingId))
  const selectedType = ref<ActType | null>(null)

  // Empêche le watcher clinicActId d'écraser les sous-objets pendant
  // qu'on préremplit le formulaire en mode édition.
  const isPopulating = ref(false)

  const actsForSelectedType = computed(() => {
    if (!selectedType.value) return []
    return clinicActs.value.filter((ca) => ca.act?.type === selectedType.value)
  })

  const selectedClinicAct = computed(() =>
    clinicActs.value.find((ca) => ca.id === form.value.clinicActId),
  )

  function reset() {
    selectedType.value = null
    form.value = defaultForm(animalMeetingId)
  }

  function populateFromAct(source: MedicalHistoryMeta) {
    isPopulating.value = true

    selectedType.value = source.clinicAct?.act?.type ?? null
    form.value = {
      animalMeetingId,
      performedAt: new Date(source.performedAt),
      notes: source.notes ?? '',
      priceApplied: Number(source.priceApplied),
      clinicActId: source.clinicActId ?? undefined,
      type: 'meeting',
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
    form.value.clinicActId = undefined
    form.value.priceApplied = undefined
    form.value.surgery = undefined
    form.value.imaging = undefined
    form.value.analysis = undefined
    form.value.hospitalization = undefined
  }

  function onClinicActChange(id: string | undefined) {
    if (isPopulating.value) return

    const clinicAct = clinicActs.value.find((ca) => ca.id === id)
    if (!clinicAct) return

    form.value.priceApplied = Number(clinicAct.price)

    const type = clinicAct.act?.type
    form.value.surgery = type === 'SURGERY' ? { anesthesiaType: 'LOCAL' } : undefined
    form.value.imaging = type === 'IMAGING' ? { imagingType: 'XRAY' } : undefined
    form.value.analysis =
      type === 'ANALYSIS' ? { analysisType: 'BLOOD', status: 'PENDING' } : undefined
    form.value.hospitalization = type === 'HOSPITALIZATION' ? { admittedAt: new Date() } : undefined
  }

  return {
    form,
    selectedType,
    actsForSelectedType,
    selectedClinicAct,
    reset,
    populateFromAct,
    onTypeChange,
    onClinicActChange,
  }
}
