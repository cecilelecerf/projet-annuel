<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Delete } from '@element-plus/icons-vue'
import type { AnimalId } from '@armali/schemas'
import { animalApi } from '../api'
import { meetingApi } from '@/features/meetings/api/meeting.api.ts'
import { useAuthStore } from '@/stores/authStore.ts'
import WeightChart from '../components/WeightChart.vue'
import ContactCard from '@/components/ContactCard.vue'
import MedicalHistorySection from '@/features/medical-histories/components/MedicalHistorySection.vue'
import { medicalHistoriesApi } from '@/features/medical-histories/medical-history.api.ts'
import AnimalHealthConditionItem from '@/features/animal-health-conditions/components/AnimalHealthConditionItem.vue'
import NotebookVaccingTable from '@/features/vaccines/components/notebook/NotebookVaccingTable.vue'
import MeetingListByAnimal from '@/features/meetings/components/animal-meeting/MeetingListByAnimal.vue'
import AnimalDetailCard from '../components/AnimalDetailCard.vue'
import DeleteAnimalDialog from '../components/DeleteAnimalDialog.vue'
dayjs.locale('fr')

const route = useRoute()
const router = useRouter()
const { user } = useAuthStore()
const deleteDialog = ref<InstanceType<typeof DeleteAnimalDialog> | null>(null)
const activeTab = ref('acts')

let animal: Awaited<ReturnType<typeof animalApi.get>> | undefined
let meetings: Awaited<ReturnType<typeof meetingApi.animal.getAllByAnimal>> = []
let vaccinesStatus: Awaited<ReturnType<typeof animalApi.getVaccines>> = []
let medicalHistories: Awaited<ReturnType<typeof medicalHistoriesApi.getByAnimal>> = []

try {
  animal = await animalApi.get(route.params.id as AnimalId)
  ;[meetings, vaccinesStatus, medicalHistories] = await Promise.all([
    meetingApi.animal.getAllByAnimal(animal.id),
    animalApi.getVaccines(route.params.id as AnimalId),
    medicalHistoriesApi.getByAnimal(animal.id),
  ])
} catch {
  router.replace({ name: 'CLIENT.Animals' })
}

const weightData = computed(
  () =>
    meetings
      ?.filter((m) => m.petWeight != null)
      .sort((a, b) => dayjs(a.meeting?.date).diff(dayjs(b.meeting?.date)))
      .map((m) => ({
        date: dayjs(m.meeting?.date).format('D MMM YY'),
        poids: Number(m.petWeight),
      })) ?? [],
)
</script>

<template>
  <template v-if="animal">
  <div class="page-header">
    <el-button text @click="router.back()">
      <el-icon><ArrowLeft /></el-icon>
      Retour
    </el-button>
    <el-button v-if="user?.role === 'CLIENT'" text type="danger" @click="deleteDialog?.open()">
      <el-icon><Delete /></el-icon>
      Supprimer cet animal
    </el-button>
  </div>

  <div class="animal-content">
    <!-- Sidebar -->
    <div class="animal-left">
      <AnimalDetailCard :animal="animal" :meetings="meetings" />
      <ContactCard
        v-if="user?.role !== 'CLIENT'"
        :route="{
          name: `${user?.role.toUpperCase()}.Clients.Detail`,
          params: { id: animal.clientId },
        }"
        :name="`${animal.client?.user.firstname} ${animal.client?.user.lastname}`"
        :metas="['Propriétaire']"
      />
      <ContactCard
        v-if="animal.attendingVeterinarianClinic"
        :name="`Dr. ${animal.attendingVeterinarianClinic?.veterinarian.user?.lastname}`"
        :metas="['Vétérinaire référent']"
      />
    </div>

    <!-- Main -->
    <div class="animal-right">
      <!-- Description -->
      <div v-if="animal.description" class="section">
        <h3 class="section-label">Description</h3>
        <p class="description-text">{{ animal.description }}</p>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ meetings.length ?? 0 }}</span>
          <span class="stat-label">Rendez-vous</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ vaccinesStatus.length }}</span>
          <span class="stat-label">Vaccins</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ animal.animalConditionHealths?.length ?? 0 }}</span>
          <span class="stat-label">Conditions</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">
            {{ vaccinesStatus.filter((v) => !v.isUpToDate).length }}
          </span>
          <span class="stat-label danger">Vaccins à renouveler</span>
        </div>
      </div>

      <WeightChart :weight-data="weightData" />
      <!-- Onglets : Actes réalisés / Vaccination / Conditions de santé -->
      <el-tabs v-model="activeTab" class="medical-tabs" type>
        <el-tab-pane name="acts">
          <template #label>
            <p class="tab-label">
              Actes réalisés
              <span class="count-badge">{{ medicalHistories?.length ?? 0 }}</span>
            </p>
          </template>
          <MedicalHistorySection
            :acts="medicalHistories"
            with-add
            disabeld-title
            :animal-id="animal.id"
          />
        </el-tab-pane>

        <el-tab-pane name="vaccines">
          <template #label>
            <span class="tab-label">
              Carnet de vaccination
              <span class="count-badge">{{ vaccinesStatus.length }}</span>
            </span>
          </template>
          <NotebookVaccingTable :vaccines="vaccinesStatus" />
        </el-tab-pane>

        <el-tab-pane name="conditions">
          <template #label>
            <span class="tab-label">
              Conditions de santé
              <span class="count-badge">{{ animal.animalConditionHealths?.length ?? 0 }}</span>
            </span>
          </template>
          <div v-if="animal.animalConditionHealths?.length" class="conditions-list">
            <AnimalHealthConditionItem
              v-for="condition in animal.animalConditionHealths"
              :key="condition.id"
              :condition="condition"
            />
          </div>
          <p v-else class="empty-text">Aucune condition de santé enregistrée</p>
        </el-tab-pane>
      </el-tabs>
      <MeetingListByAnimal
        :meetings="meetings"
        :animal-id="animal.id"
        :client-id="animal.clientId"
        :more="true"
      />
    </div>
  </div>

  <DeleteAnimalDialog ref="deleteDialog" :animal-id="animal.id" :animal-name="animal.name" />
  </template>
</template>

<style lang="scss" scoped>
.animal-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);

  @include above('lg') {
    flex-direction: row;
    align-items: flex-start;
  }
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

.animal-left {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  @include above('lg') {
    width: 280px;
    flex-shrink: 0;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

.animal-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  min-width: 0;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);

  @include above('sm') {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-md);
  background: var(--el-fill-color-light);
  border-radius: var(--radius-lg);
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;

  &.danger {
    color: var(--el-color-danger);
  }
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--radius-full);
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: var(--fw-semibold);
}

// ── Conditions ────────────────────────────────────────────────────────────────

.conditions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

// ── Description ───────────────────────────────────────────────────────────────

.empty-text {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
  margin: 0;
}
</style>
