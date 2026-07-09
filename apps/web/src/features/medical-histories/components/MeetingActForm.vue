<script setup lang="ts">
import type { ClinicAct, ClinicId, MedicalHistoryMeta, MeetingId } from '@armali/schemas'
import { ref, computed, watch } from 'vue'
import { clinicActApi } from '@/features/clinics/clinic-acts/clinic-act.api.ts'
import { useMeetingActForm } from '../composables/useMeetingActForm'
import ActTypeAndActSelect from './act-fields/CinicActTypeAndClinicActSelect.vue'
import SurgeryFields from './act-fields/SurgeryFields.vue'
import ImagingFields from './act-fields/ImagingFields.vue'
import AnalysisFields from './act-fields/AnalysisFields.vue'
import HospitalizationFields from './act-fields/HospitalizationFields.vue'
import { medicalHistoriesApi } from '../medical-history.api.ts'

const { act, clinicId, animalMeetingId } = defineProps<{
  animalMeetingId: MeetingId
  clinicId?: ClinicId
  act?: MedicalHistoryMeta | null
}>()

const visible = defineModel<boolean>({ required: true })

const emit = defineEmits<{ saved: [] }>()

const loading = ref(false)
const clinicActs = ref<ClinicAct[]>([])

async function loadClinicActs() {
  if (!clinicId) {
    clinicActs.value = []
    return
  }
  clinicActs.value = await clinicActApi.getByClinic(clinicId)
}

const {
  form,
  selectedType,
  actsForSelectedType,
  selectedClinicAct,
  reset,
  populateFromAct,
  onTypeChange,
  onClinicActChange,
} = useMeetingActForm(animalMeetingId, clinicActs)

const isEditing = computed(() => !!act)

watch(visible, async (isVisible) => {
  if (!isVisible) return
  await loadClinicActs()
  if (act) {
    populateFromAct(act)
  } else {
    reset()
  }
})

function close() {
  visible.value = false
}

async function onSave() {
  loading.value = true
  try {
    if (isEditing.value && act) {
      if (form.value.type !== 'meeting') return

      await medicalHistoriesApi.update({
        medicalHistoryId: act.id,
        body: { ...form.value, type: 'meeting' },
      })
    } else {
      if (
        !form.value.animalMeetingId ||
        form.value.type !== 'meeting' ||
        !form.value.performedAt ||
        !form.value.clinicActId ||
        form.value.clinicActId === null ||
        !form.value.animalMeetingId
      )
        return
      await medicalHistoriesApi.create({
        body: {
          ...form.value,
          notes: form.value.notes ?? '',
          performedAt: form.value.performedAt!,
          clinicActId: form.value.clinicActId!,
          animalMeetingId: form.value.animalMeetingId!,
          type: 'meeting',
        },
      })
    }
    emit('saved')
    close()
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="isEditing ? 'Modifier l\'acte' : 'Ajouter un acte'"
    width="520px"
    align-center
  >
    <div class="form">
      <ActTypeAndActSelect
        v-model:selected-type="selectedType"
        v-model:form="form"
        :acts-for-selected-type="actsForSelectedType"
        :selected-clinic-act="selectedClinicAct"
        :is-editing="isEditing"
        @type-change="onTypeChange"
        @clinic-act-change="onClinicActChange"
      />

      <div class="field">
        <label class="field-label">Réalisé le</label>
        <el-date-picker
          v-model="form.performedAt"
          type="datetime"
          format="DD/MM/YYYY HH:mm"
          size="large"
          style="width: 100%"
        />
      </div>

      <div class="field">
        <label class="field-label">Notes</label>
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="3"
          placeholder="Observations, remarques..."
        />
      </div>

      <template v-if="form.clinicActId">
        <SurgeryFields
          v-if="selectedType === 'SURGERY' && form.surgery"
          v-model:surgery="form.surgery"
        />
        <ImagingFields
          v-if="selectedType === 'IMAGING' && form.imaging"
          v-model:imaging="form.imaging"
        />
        <AnalysisFields
          v-if="selectedType === 'ANALYSIS' && form.analysis"
          v-model:analysis="form.analysis"
        />
        <HospitalizationFields
          v-if="selectedType === 'HOSPITALIZATION' && form.hospitalization"
          v-model:hospitalization="form.hospitalization"
        />
      </template>
    </div>

    <template #footer>
      <el-button size="large" @click="close">Annuler</el-button>
      <el-button type="primary" size="large" :loading="loading" @click="onSave">
        {{ isEditing ? 'Enregistrer' : 'Ajouter' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  max-height: 60vh;
  overflow-y: auto;
  padding-right: var(--spacing-2xs);
}
.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.field-label {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
