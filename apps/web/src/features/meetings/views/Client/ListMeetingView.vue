<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { Calendar, Search } from '@element-plus/icons-vue'
import { calendarApi } from '../../api/calendar.api.ts'
import { useAuthStore } from '@/stores/authStore'
import MeetingCard from '../../components/animal-meeting/MeetingCard.vue'
import { useRouter } from 'vue-router'

dayjs.locale('fr')
const { user } = useAuthStore()
const router = useRouter()
if (!user) throw new Error('Non authentifié')

const animalMeetings = await calendarApi.animal.getAllByClientId(user?.id)
export type MeetingStatus = 'UPCOMING' | 'PAST'

// ── Filtres ───────────────────────────────────────────────────────────────────
const search = ref('')
const filterStatus = ref<'ALL' | MeetingStatus>('ALL')
const filterAnimal = ref('')

const animals = computed(() => {
  const names = [...new Set(animalMeetings.map((m) => m.animal.name))]
  return names
})

const filtered = computed(() => {
  return animalMeetings
    .map((m) => ({
      ...m,
      status: (dayjs(m.meeting.date) > dayjs() ? 'UPCOMING' : 'PAST') as MeetingStatus,
    }))
    .filter((m) => {
      if (filterStatus.value !== 'ALL' && m.status !== filterStatus.value) return false
      if (filterAnimal.value && m.animal.name !== filterAnimal.value) return false
      if (search.value) {
        const q = search.value.toLowerCase()
        return (
          m.animal.name.toLowerCase().includes(q) ||
          m.speciality?.name?.toLowerCase().includes(q) ||
          m.veterinarianClinic.clinic.name.toLowerCase().includes(q) ||
          `${m.veterinarianClinic.veterinarian.firstname} ${m.veterinarianClinic.veterinarian.lastname}`
            .toLowerCase()
            .includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      if (a.status === 'UPCOMING' && b.status === 'PAST') return -1
      if (a.status === 'PAST' && b.status === 'UPCOMING') return 1
      return a.meeting.date.getTime() - b.meeting.date.getTime()
    })
})

const upcoming = computed(() => filtered.value.filter((m) => m.status === 'UPCOMING'))
const past = computed(() => filtered.value.filter((m) => m.status === 'PAST'))
</script>

<template>
  <!-- Header -->
  <div class="page-header">
    <div>
      <h1 class="page-title">Mes rendez-vous</h1>
      <p class="page-subtitle">{{ animalMeetings.length }} rendez-vous au total</p>
    </div>
    <el-button @click="() => router.push({ name: 'CLIENT.Booking' })"
      >Nouveau rendez-vous</el-button
    >
  </div>

  <!-- Filtres -->
  <div class="filters">
    <el-input
      v-model="search"
      placeholder="Rechercher un animal, spécialité, clinique..."
      :prefix-icon="Search"
      clearable
      class="search-input"
    />

    <el-select v-model="filterStatus" style="width: 150px">
      <el-option label="Tous" value="ALL" />
      <el-option label="À venir" value="UPCOMING" />
      <el-option label="Passés" value="PAST" />
    </el-select>

    <el-select v-model="filterAnimal" placeholder="Tous les animaux" clearable style="width: 160px">
      <el-option v-for="name in animals" :key="name" :label="name" :value="name" />
    </el-select>
  </div>

  <!-- Vide -->
  <div v-if="filtered.length === 0" class="empty-state">
    <el-icon class="empty-icon"><Calendar /></el-icon>
    <p class="empty-title">Aucun rendez-vous trouvé</p>
    <p class="empty-desc">Modifie tes filtres ou prends un nouveau rendez-vous</p>
  </div>

  <template v-else>
    <!-- À venir -->
    <section v-if="upcoming.length > 0" class="section">
      <h2 class="section-title">
        À venir
        <span class="section-count">{{ upcoming.length }}</span>
      </h2>
      <div class="meetings-list">
        <MeetingCard
          v-for="m in upcoming"
          :animalMeeting="m"
          :key="m.meeting.id"
          :status="m.status"
        />
      </div>
    </section>

    <!-- Passés -->
    <section v-if="past.length > 0" class="section">
      <h2 class="section-title">
        Historique
        <span class="section-count">{{ past.length }}</span>
      </h2>
      <div class="meetings-list">
        <MeetingCard v-for="m in past" :animalMeeting="m" :key="m.meeting.id" :status="m.status" />
      </div>
    </section>
  </template>
</template>

<style scoped lang="scss">
// ── Header ────────────────────────────────────────────────────────────────────
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.page-title {
  font-size: 28px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.page-subtitle {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  margin: 4px 0 0;
}

// ── Filtres ───────────────────────────────────────────────────────────────────
.filters {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

// ── Sections ──────────────────────────────────────────────────────────────────
.section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.section-title {
  font-size: 15px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  margin: 0;
  margin-top: var(--spacing-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.section-count {
  background: var(--el-fill-color);
  border-radius: var(--radius-full);
  padding: 2px 8px;
  font-size: 12px;
  font-weight: var(--fw-regular);
  color: var(--el-text-color-secondary);
  text-transform: none;
  letter-spacing: 0;
}

// ── Cards ─────────────────────────────────────────────────────────────────────
.meetings-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.meeting-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }

  &.past {
    opacity: 0.75;

    &:hover {
      opacity: 1;
    }
  }
}

// ── Date block ────────────────────────────────────────────────────────────────
.card-left {
  flex-shrink: 0;
}

.date-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);

  &.past {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color-lighter);
  }
}

.date-day {
  font-size: 20px;
  font-weight: var(--fw-bold);
  color: var(--el-color-primary);
  line-height: 1;

  .past & {
    color: var(--el-text-color-secondary);
  }
}

.date-month {
  font-size: 11px;
  font-weight: var(--fw-semibold);
  color: var(--el-color-primary-light-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;

  .past & {
    color: var(--el-text-color-placeholder);
  }
}

// ── Body ─────────────────────────────────────────────────────────────────────
.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.card-top {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
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

.card-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);

  .el-icon {
    font-size: 13px;
    color: var(--el-text-color-placeholder);
  }
}

.card-bottom {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.clinic-name {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// ── Right ─────────────────────────────────────────────────────────────────────
.card-right {
  flex-shrink: 0;
}

// ── Empty state ───────────────────────────────────────────────────────────────
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4xl) var(--spacing-xl);
  gap: var(--spacing-sm);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: var(--el-color-primary-light-5);
  margin-bottom: var(--spacing-sm);
}

.empty-title {
  font-size: 18px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.empty-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}
</style>
