<script setup lang="ts">
import type { Act, AnimalId, MedicalHistoryMeta } from '@armali/schemas'
import { ref, computed, watch } from 'vue'
import { actApi } from '@/features/acts/act.api'
import { useFreeMedicalHistoryForm } from '../composables/useFreeActForm.ts'
import ActTypeAndCatalogActSelect from './act-fields/ActTypeAndCatalogActSelect.vue'
import { medicalHistoriesApi } from '../medical-history.api.ts'
import HospitalizationFields from './act-fields/HospitalizationFields.vue'
import AnalysisFields from './act-fields/AnalysisFields.vue'
import ImagingFields from './act-fields/ImagingFields.vue'
import SurgeryFields from './act-fields/SurgeryFields.vue'

const { animalId, act } = defineProps<{
  animalId: AnimalId
  act?: MedicalHistoryMeta | null
}>()

const visible = defineModel<boolean>({ required: true })

const emit = defineEmits<{ saved: [] }>()

const loading = ref(false)
const acts = ref<Act[]>([])

async function loadActs() {
  acts.value = await actApi.getAll()
}

const {
  form,
  selectedType,
  actsForSelectedType,
  reset,
  populateFromAct,
  onTypeChange,
  onActChange,
} = useFreeMedicalHistoryForm(animalId, acts)

const isEditing = computed(() => !!act)

watch(visible, async (isVisible) => {
  if (!isVisible) return
  await loadActs()
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
      if (form.value.type !== 'free') return
      await medicalHistoriesApi.update({
        medicalHistoryId: act.id,
        body: { ...form.value, type: 'free' },
      })
    } else {
      if (!form.value.actId || !form.value.performedAt) return
      await medicalHistoriesApi.create({
        body: {
          ...form.value,
          animalId,
          notes: form.value.notes ?? '',
          type: 'free',
          actId: form.value.actId!,
          performedAt: form.value.performedAt!,
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
    :title="isEditing ? 'Modifier l\'acte' : 'Ajouter un acte à l\'historique'"
    width="480px"
    align-center
  >
    <div class="form">
      <ActTypeAndCatalogActSelect
        v-model:selected-type="selectedType"
        v-model:form="form"
        :acts-for-selected-type="actsForSelectedType"
        @type-change="onTypeChange"
        @act-change="onActChange"
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
    </div>
    <template v-if="form.actId">
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
