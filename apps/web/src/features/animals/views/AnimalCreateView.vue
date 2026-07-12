<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useFormErrorStore } from '@/stores/formErrorStore'
import { petApi } from '@/features/pets/api'
import { animalApi } from '../api'
import type { CreateAnimal, PetId, RaceId } from '@armali/schemas'
import dayjs from 'dayjs'
import { raceApi } from '@/features/races/api'
import { useNotify } from '@/composables/useNotify'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const formError = useFormErrorStore()
const notify = useNotify()
const { user } = useAuthStore()

// ── Référentiels (espèces / races / cliniques) ─────────────────────────────
const pets = ref<{ id: PetId; name: string }[]>([])
const races = ref<Record<PetId, { id: RaceId; name: string }[]>>({})
const loadingReferentials = ref(true)

async function loadReferentials() {
  loadingReferentials.value = true
  try {
    pets.value = await petApi.getAll()
  } catch (err) {
    formError.handle(err)
  } finally {
    loadingReferentials.value = false
  }
}
loadReferentials()

// ── État du formulaire ───────────────────────────────────────────────────
const formRef = ref<FormInstance>()

const submitting = ref(false)

const form = reactive<CreateAnimal & { petId: PetId }>({
  name: '',
  petId: '' as PetId,
  raceId: '' as RaceId,
  dateOfBirth: dayjs().toDate(),
  description: undefined,
  activity: 3,
  outdoorAccess: false,
  animalContact: false,
  hasInsurance: false,
  insuranceProvider: undefined,
  insurancePolicyNumber: undefined,
})

function onPetChange() {
  loadRacesForPet(form.petId)
  // Réinitialise la race si elle n'appartient plus à l'espèce sélectionnée
  form.raceId = '' as RaceId
}

const rules: FormRules = {
  name: [{ required: true, message: "Le nom de l'animal est requis.", trigger: 'blur' }],
  petId: [{ required: true, message: 'Sélectionne une espèce.', trigger: 'change' }],
  raceId: [{ required: true, message: 'Sélectionne une race.', trigger: 'change' }],
  dateOfBirth: [
    { required: true, message: 'La date de naissance est requise.', trigger: 'change' },
  ],
}

// ── Soumission ────────────────────────────────────────────────────────────
async function onSubmit() {
  if (!formRef.value) return
  formError.clear()

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const created = await animalApi.create(form)
    ElMessage.success(`${form.name} a bien été ajouté.`)
    router.push({ name: `${user?.role.toUpperCase()}.Animals.Detail`, params: { id: created.id } })
  } catch (err) {
    console.log(err)
    formError.handle(err)
  } finally {
    submitting.value = false
  }
}

async function loadRacesForPet(petId: PetId) {
  if (races.value?.[petId]) return
  loadingReferentials.value = true
  try {
    races.value[petId] = await raceApi.getByPetId(petId)
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur de chargement des races')
  } finally {
    loadingReferentials.value = false
  }
}

function onCancel() {
  router.back()
}

const activityLabels: Record<number, string> = {
  1: 'Très calme',
  2: 'Calme',
  3: 'Modérée',
  4: 'Actif',
  5: 'Très actif',
}
</script>

<template>
  <header class="aa-header">
    <div>
      <span class="aa-eyebrow">Mes animaux</span>
      <h1 class="aa-title">Ajouter un animal</h1>
      <p class="aa-sub">Renseigne les informations de ton compagnon pour créer sa fiche.</p>
    </div>
  </header>

  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-position="top"
    class="aa-form"
    @submit.prevent
  >
    <!-- Informations générales -->
    <section class="aa-section">
      <div class="aa-section-label">Informations générales</div>
      <div class="aa-grid">
        <el-form-item label="Nom de l'animal" prop="name">
          <el-input v-model="form.name" placeholder="Ex. Rex" maxlength="50" />
        </el-form-item>

        <el-form-item label="Date de naissance" prop="dateOfBirth">
          <el-date-picker
            v-model="form.dateOfBirth"
            type="date"
            placeholder="Sélectionner une date"
            style="width: 100%"
            :disabled-date="(d: Date) => d.getTime() > Date.now()"
          />
        </el-form-item>

        <el-form-item label="Espèce" prop="petId">
          <el-select
            v-model="form.petId"
            placeholder="Choisir une espèce"
            style="width: 100%"
            :loading="loadingReferentials"
            @change="onPetChange"
          >
            <el-option v-for="p in pets" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="Race" prop="raceId">
          <el-select
            v-model="form.raceId"
            placeholder="Choisir une race"
            style="width: 100%"
            :disabled="!form.petId"
            :loading="loadingReferentials"
          >
            <el-option v-for="r in races[form.petId]" :key="r.id" :label="r.name" :value="r.id" />
            <template v-if="form.petId && !races[form.petId]?.length" #empty>
              <div class="aa-select-empty">Aucune race disponible pour cette espèce.</div>
            </template>
          </el-select>
        </el-form-item>
      </div>
    </section>

    <div class="aa-divider" />

    <!-- Caractéristiques -->
    <section class="aa-section">
      <div class="aa-section-label">Caractéristiques</div>

      <div class="aa-activity-block">
        <div class="aa-activity-header">
          <span class="aa-field-label">Niveau d'activité</span>
          <span class="aa-activity-value">{{ activityLabels[form.activity ?? 3] }}</span>
        </div>
        <el-slider v-model="form.activity" :min="1" :max="5" :step="1" show-stops />
      </div>

      <div class="aa-switch-row">
        <div class="aa-switch-item">
          <div class="aa-switch-text">
            <span class="aa-field-label">Accès à l'extérieur</span>
            <span class="aa-field-hint">L'animal a un accès régulier à un extérieur.</span>
          </div>
          <el-switch v-model="form.outdoorAccess" />
        </div>
        <div class="aa-switch-item">
          <div class="aa-switch-text">
            <span class="aa-field-label">Contact avec d'autres animaux</span>
            <span class="aa-field-hint">L'animal côtoie régulièrement d'autres animaux.</span>
          </div>
          <el-switch v-model="form.animalContact" />
        </div>
      </div>
    </section>

    <div class="aa-divider" />

    <section class="aa-section">
      <div class="aa-section-label">Assurance santé</div>

      <div class="aa-switch-row">
        <div class="aa-switch-item">
          <div class="aa-switch-text">
            <span class="aa-field-label">Animal assuré</span>
            <span class="aa-field-hint">
              Informatif : la clinique facture toujours le prix plein, le remboursement se fait
              directement auprès de l'assureur.
            </span>
          </div>
          <el-switch v-model="form.hasInsurance" />
        </div>
      </div>

      <div v-if="form.hasInsurance" class="aa-grid">
        <el-form-item label="Assureur">
          <el-input v-model="form.insuranceProvider" placeholder="Ex. SantéVet" maxlength="100" />
        </el-form-item>
        <el-form-item label="Numéro de contrat">
          <el-input v-model="form.insurancePolicyNumber" placeholder="Ex. AB123456" maxlength="100" />
        </el-form-item>
      </div>
    </section>

    <div class="aa-divider" />

    <!-- Notes -->
    <section class="aa-section">
      <div class="aa-section-label">Notes</div>
      <el-form-item label="Description" class="aa-full">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          placeholder="Particularités, habitudes, informations utiles pour la clinique..."
        />
      </el-form-item>
    </section>

    <!-- Actions -->
    <footer class="aa-footer">
      <el-button size="large" @click="onCancel">Annuler</el-button>
      <el-button size="large" type="primary" :icon="Plus" :loading="submitting" @click="onSubmit">
        Ajouter l'animal
      </el-button>
    </footer>
  </el-form>
</template>

<style scoped lang="scss">
// ── Header ────────────────────────────────────────────────────────────────
.aa-header {
  padding-bottom: var(--spacing-md);
}

.aa-eyebrow {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--el-color-primary);
  display: block;
  margin-bottom: var(--spacing-xs);
}

.aa-title {
  font-family: 'Nunito', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-xs);
}

.aa-sub {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

// ── Form shell ────────────────────────────────────────────────────────────
.aa-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.aa-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.aa-section-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--el-text-color-placeholder);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.aa-divider {
  height: 1px;
  background: var(--el-border-color-lighter);
}

.aa-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md) var(--spacing-lg);

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.aa-full {
  margin-bottom: 0;
}

// ── Photo ─────────────────────────────────────────────────────────────────
.aa-photo-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.aa-photo-upload {
  cursor: pointer;
}

.aa-photo-circle {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: var(--el-color-primary-light-9);
  border: 1.5px dashed var(--el-color-primary-light-5);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: border-color 0.15s;

  &:hover {
    border-color: var(--el-color-primary);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.aa-photo-icon {
  font-size: 26px;
  color: var(--el-color-primary-light-3);
}

.aa-photo-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.aa-photo-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

// ── Fields ────────────────────────────────────────────────────────────────
.aa-field-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.aa-field-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.aa-select-empty {
  padding: var(--spacing-sm);
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  text-align: center;
}

// ── Activity ──────────────────────────────────────────────────────────────
.aa-activity-block {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--el-border-color-lighter);
}

.aa-activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.aa-activity-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 2px 10px;
  border-radius: var(--radius-full);
}

// ── Switches ──────────────────────────────────────────────────────────────
.aa-switch-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.aa-switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--el-border-color-lighter);
}

.aa-switch-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

// ── Footer ────────────────────────────────────────────────────────────────
.aa-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-sm);
}

// ── Responsive ────────────────────────────────────────────────────────────
@media (max-width: 640px) {
  .aa-grid {
    grid-template-columns: 1fr;
  }

  .aa-footer {
    flex-direction: column-reverse;

    .el-button {
      width: 100%;
      margin-left: 0 !important;
    }
  }
}
</style>
