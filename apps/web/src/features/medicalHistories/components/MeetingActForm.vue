<script setup lang="ts">
import type { CreateMedicalHistory, MedicalHistory, MeetingId } from '@armali/schemas'
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { medicalHistoriesApi } from '../api'

const { meetingId, act } = defineProps<{
  modelValue: boolean
  meetingId: MeetingId
  act?: MedicalHistory | null
}>()
const emit = defineEmits<{
  'update:modelValue': [boolean]
  saved: []
}>()
console.log(meetingId)

const { user } = useAuthStore()
const loading = ref(false)

const clinicActs = await medicalHistoriesApi.getByClinic(user!.clinicId!)

const defaultForm = (): Partial<CreateMedicalHistory> => ({
  meetingId,
  performedAt: new Date(),
  notes: '',
  priceApplied: 0,
  clinicActId: undefined,
  performedByIds: [],
})

const form = ref(defaultForm())
const selectedActType = computed(
  () => clinicActs.find((ca) => ca.id === form.value.clinicActId)?.act?.type,
)
// Pré-remplit si édition
watch(
  () => act,
  (act) => {
    if (act) {
      form.value = {
        meetingId,
        performedAt: new Date(act.performedAt),
        notes: act.notes ?? '',
        priceApplied: Number(act.priceApplied),
        clinicActId: act.clinicActId,
        performedByIds: act.performedBy?.map((p) => p.veterinarianId) ?? [],
      }
    } else {
      form.value = defaultForm()
    }
  },
  { immediate: true },
)

const isEditing = computed(() => !!act)

watch(
  () => form.value.clinicActId,
  (id) => {
    const clinicAct = clinicActs.find((ca) => ca.id === id)
    if (!clinicAct) return

    if (!isEditing.value) {
      form.value.priceApplied = Number(clinicAct.price)
    }

    // Initialise le bon sous-objet selon le type
    const type = clinicAct.act?.type
    form.value.surgery = type === 'SURGERY' ? { anesthesiaType: 'LOCAL' } : undefined
    form.value.imaging = type === 'IMAGING' ? { imagingType: 'XRAY' } : undefined
    form.value.analysis =
      type === 'ANALYSIS' ? { analysisType: 'BLOOD', status: 'PENDING' } : undefined
    form.value.hospitalization = type === 'HOSPITALIZATION' ? { admittedAt: new Date() } : undefined
  },
)
const close = () => emit('update:modelValue', false)

const onSave = async () => {
  loading.value = true
  try {
    if (isEditing.value && act) {
      await medicalHistoriesApi.update(meetingId, act.id, form.value)
    } else {
      await medicalHistoriesApi.create(meetingId, form.value)
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
  <el-drawer
    :model-value="modelValue"
    :title="isEditing ? 'Modifier l\'acte' : 'Ajouter un acte'"
    direction="rtl"
    size="480px"
    @close="close"
  >
    <div class="form">
      <div class="field">
        <label class="field-label">Acte</label>
        <el-select
          v-model="form.clinicActId"
          placeholder="Sélectionner un acte..."
          size="large"
          style="width: 100%"
          filterable
        >
          <el-option
            v-for="ca in clinicActs"
            :key="ca.id"
            :label="`${ca.act?.name} — ${Number(ca.price).toFixed(2)} €`"
            :value="ca.id"
          />
        </el-select>
      </div>

      <!-- Prix appliqué -->
      <div class="field">
        <label class="field-label">Prix appliqué (€)</label>
        <el-input-number
          v-model="form.priceApplied"
          :precision="2"
          :step="1"
          :min="0"
          size="large"
          style="width: 100%"
        />
      </div>

      <!-- Date de réalisation -->
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

      <!-- Notes -->
      <div class="field">
        <label class="field-label">Notes</label>
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="3"
          placeholder="Observations, remarques..."
        />
      </div>

      <!-- Détails selon le type d'acte sélectionné -->
      <template v-if="form.clinicActId">
        <template v-if="selectedActType === 'SURGERY'">
          <div class="field">
            <label class="field-label">Anesthésie</label>
            <el-select v-model="form.surgery!.anesthesiaType" size="large" style="width: 100%">
              <el-option label="Locale" value="LOCAL" />
              <el-option label="Générale" value="GENERAL" />
              <el-option label="Sédation" value="SEDATION" />
            </el-select>
          </div>
          <div class="field">
            <label class="field-label">Durée (min)</label>
            <el-input-number
              v-model="form.surgery!.duration"
              :min="0"
              size="large"
              style="width: 100%"
            />
          </div>
          <div class="field">
            <label class="field-label">Complications</label>
            <el-input v-model="form.surgery!.complications" type="textarea" :rows="2" />
          </div>
          <div class="field">
            <label class="field-label">Instructions post-op</label>
            <el-input v-model="form.surgery!.postOpInstructions" type="textarea" :rows="2" />
          </div>
        </template>

        <template v-if="selectedActType === 'IMAGING'">
          <div class="field">
            <label class="field-label">Type d'imagerie</label>
            <el-select v-model="form.imaging!.imagingType" size="large" style="width: 100%">
              <el-option label="Radiographie" value="XRAY" />
              <el-option label="Échographie" value="ULTRASOUND" />
              <el-option label="Scanner" value="SCANNER" />
              <el-option label="IRM" value="MRI" />
            </el-select>
          </div>
          <div class="field">
            <label class="field-label">Zone</label>
            <el-input
              v-model="form.imaging!.bodyPart"
              size="large"
              placeholder="Ex: thorax, abdomen..."
            />
          </div>
          <div class="field">
            <label class="field-label">Résultats</label>
            <el-input v-model="form.imaging!.findings" type="textarea" :rows="3" />
          </div>
        </template>

        <template v-if="selectedActType === 'ANALYSIS'">
          <div class="field">
            <label class="field-label">Type d'analyse</label>
            <el-select v-model="form.analysis!.analysisType" size="large" style="width: 100%">
              <el-option label="Prise de sang" value="BLOOD" />
              <el-option label="Urine" value="URINE" />
              <el-option label="Selles" value="STOOL" />
              <el-option label="Biopsie" value="BIOPSY" />
              <el-option label="Cytologie" value="CYTOLOGY" />
              <el-option label="Autre" value="OTHER" />
            </el-select>
          </div>
          <div class="field">
            <label class="field-label">Laboratoire</label>
            <el-input
              v-model="form.analysis!.laboratory"
              size="large"
              placeholder="Nom du laboratoire..."
            />
          </div>
        </template>

        <template v-if="selectedActType === 'HOSPITALIZATION'">
          <div class="field">
            <label class="field-label">Date d'admission</label>
            <el-date-picker
              v-model="form.hospitalization!.admittedAt"
              type="datetime"
              format="DD/MM/YYYY HH:mm"
              size="large"
              style="width: 100%"
            />
          </div>
          <div class="field">
            <label class="field-label">Numéro de box</label>
            <el-input
              v-model="form.hospitalization!.boxNumber"
              size="large"
              placeholder="Ex: B12"
            />
          </div>
        </template>
      </template>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button size="large" @click="close">Annuler</el-button>
        <el-button type="primary" size="large" :loading="loading" @click="onSave">
          {{ isEditing ? 'Enregistrer' : 'Ajouter' }}
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style lang="scss" scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-xl);
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

.drawer-footer {
  display: flex;
  gap: var(--spacing-sm);

  .el-button {
    flex: 1;
  }
}
</style>
