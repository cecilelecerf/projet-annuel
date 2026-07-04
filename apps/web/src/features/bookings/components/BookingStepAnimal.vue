<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { animalApi } from '@/features/animals/api'
import type { BookingAnimal, BookingSpeciality, SpecialityId } from '@armali/schemas'
import { specialityApi } from '@/features/specialities/speciality.api'

const authStore = useAuthStore()

const selectedAnimal = defineModel<BookingAnimal | null>('animal', { required: true })
const selectedSpecialityId = defineModel<SpecialityId | null>('specialityId', { required: true })
const reason = defineModel<string>('reason', { required: true })

const animals = ref<BookingAnimal[]>([])
const specialities = ref<BookingSpeciality[]>([])
const loading = ref(true)

async function load() {
  if (!authStore.user) return
  loading.value = true
  try {
    const [animalsData, specialitiesData] = await Promise.all([
      animalApi.getAll(),
      specialityApi.getAll(),
    ])
    animals.value = animalsData
    specialities.value = specialitiesData
  } finally {
    loading.value = false
  }
}

await load()

const VISIT_REASONS = [
  'Consultation générale',
  'Vaccination',
  'Suivi post-opératoire',
  'Urgence',
  'Bilan de santé',
  'Autre',
]
</script>

<template>
  <div class="step">
    <div class="step-intro">
      <h2 class="step-title">Pour quel animal ?</h2>
      <p class="step-desc">Sélectionnez l'animal concerné par ce rendez-vous.</p>
    </div>

    <div v-if="loading" class="loading">
      <el-skeleton :rows="3" animated />
    </div>

    <template v-else>
      <div class="animal-grid">
        <button
          v-for="animal in animals"
          :key="animal.id"
          class="animal-card"
          :class="{ 'animal-card--selected': selectedAnimal?.id === animal.id }"
          @click="selectedAnimal = animal"
        >
          <div class="animal-avatar">
            <span>🐾</span>
          </div>
          <div class="animal-info">
            <span class="animal-name">{{ animal.name }}</span>
            <span class="animal-race">{{ animal.race.pet.name }} · {{ animal.race.name }}</span>
          </div>
          <div v-if="selectedAnimal?.id === animal.id" class="animal-check">
            <el-icon><Check /></el-icon>
          </div>
        </button>

        <div v-if="animals.length === 0" class="empty-animals">
          <p>Vous n'avez pas encore d'animal enregistré.</p>
          <el-button type="success" size="small" @click="$router.push('/animals/new')">
            Ajouter un animal
          </el-button>
        </div>
      </div>

      <div v-if="selectedAnimal" class="section">
        <h3 class="section-label">
          Motif de la visite
          <span class="optional">facultatif</span>
        </h3>
        <div class="reason-chips">
          <button
            v-for="r in VISIT_REASONS"
            :key="r"
            class="reason-chip"
            :class="{ 'reason-chip--selected': reason === r }"
            @click="reason = reason === r ? '' : r"
          >
            {{ r }}
          </button>
        </div>
        <el-input
          v-if="reason === 'Autre'"
          v-model="reason"
          type="textarea"
          :rows="2"
          placeholder="Décrivez le motif..."
          class="reason-input"
        />
      </div>

      <div v-if="selectedAnimal" class="section">
        <h3 class="section-label">
          Spécialité souhaitée
          <span class="optional">facultatif</span>
        </h3>
        <el-select
          v-model="selectedSpecialityId"
          placeholder="Toutes les spécialités"
          clearable
          style="width: 100%"
        >
          <el-option v-for="s in specialities" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.step {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}
.step-intro {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.step-title {
  font-family: 'Nunito', sans-serif;
  font-size: 22px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}
.step-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}
.animal-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.animal-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  font-family: 'DM Sans', sans-serif;
  width: 100%;
  &:hover {
    border-color: var(--el-color-#{meeting-color('animal')}-light-5);
    background: var(--el-color-#{meeting-color('animal')}-light-9);
  }
  &--selected {
    border-color: var(--el-color-#{meeting-color('animal')});
    background: var(--el-color-#{meeting-color('animal')}-light-9);
  }
}
.animal-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}
.animal-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.animal-name {
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}
.animal-race {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.animal-check {
  color: var(--el-color-#{meeting-color('animal')});
  font-size: 18px;
}
.section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.section-label {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.optional {
  font-size: 10px;
  font-weight: var(--fw-regular);
  color: var(--el-text-color-placeholder);
  text-transform: none;
  letter-spacing: 0;
  background: var(--el-fill-color);
  padding: 2px 6px;
  border-radius: var(--radius-full);
}
.reason-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}
.reason-chip {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: var(--el-color-#{meeting-color('animal')}-light-5);
    color: var(--el-color-#{meeting-color('animal')});
  }
  &--selected {
    border-color: var(--el-color-#{meeting-color('animal')});
    background: var(--el-color-#{meeting-color('animal')}-light-9);
    color: var(--el-color-#{meeting-color('animal')});
    font-weight: var(--fw-medium);
  }
}
.reason-input {
  margin-top: var(--spacing-xs);
}
.empty-animals {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-2xl);
  border: 1px dashed var(--el-border-color);
  border-radius: var(--radius-lg);
  text-align: center;
  p {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}
.loading {
  padding: var(--spacing-lg) 0;
}
</style>
