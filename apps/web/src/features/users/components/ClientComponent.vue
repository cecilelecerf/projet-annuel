<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import type { Client } from '@armali/schemas'
import { animalApi } from '@/features/animals/api'
import { calendarApi } from '@/features/meetings/api/calendar.api'

const { client } = defineProps<{ client: Client }>()
dayjs.locale('fr')
const router = useRouter()
const [animals, meetings] = await Promise.all([
  animalApi.getAllByUser(client.id),
  calendarApi.animal.getAllByClientId(client.id),
])
const clientAge = dayjs().diff(dayjs(client.clientProfile?.dateOfBirth), 'year')
</script>

<template>
  <div class="page-header">
    <el-button text @click="router.back()">
      <el-icon><ArrowLeft /></el-icon>
      Retour
    </el-button>
  </div>

  <div class="client-content">
    <div class="client-left">
      <div class="profile-card">
        <div class="profile-avatar">
          {{ client.firstname.charAt(0) }}{{ client.lastname.charAt(0) }}
        </div>
        <h2 class="profile-name">{{ client.firstname }} {{ client.lastname }}</h2>
        <span class="profile-role">Client</span>

        <div class="profile-details">
          <div class="detail-row">
            <el-icon><Message /></el-icon>
            <span>{{ client.email }}</span>
          </div>
          <div v-if="client.clientProfile?.phone" class="detail-row">
            <el-icon><Phone /></el-icon>
            <span>{{ client.clientProfile.phone }}</span>
          </div>
          <div v-if="client.clientProfile?.address" class="detail-row">
            <el-icon><Location /></el-icon>
            <span>{{ client.clientProfile.address }}</span>
          </div>
          <div v-if="client.clientProfile?.dateOfBirth" class="detail-row">
            <el-icon><Calendar /></el-icon>
            <span>
              {{ dayjs(client.clientProfile.dateOfBirth).format('D MMMM YYYY') }}
              ({{ clientAge }} ans)
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="client-right">
      <div class="section">
        <h3 class="section-label">
          <!-- <el-icon><Dog /></el-icon> -->
          Animaux
          <span class="count-badge">{{ animals.length ?? 0 }}</span>
        </h3>

        <div v-if="animals.length" class="pets-grid">
          <div
            v-for="pet in animals"
            :key="pet.id"
            class="pet-card"
            @click="router.push({ name: 'Secretary.Animals.Detail', params: { id: pet.id } })"
          >
            <div class="pet-avatar">{{ pet.name.charAt(0) }}</div>
            <div class="pet-info">
              <span class="pet-name">{{ pet.name }}</span>
              <span class="pet-meta"> {{ pet.race?.pet?.name }} · {{ pet.race?.name }} </span>
              <span class="pet-meta"> {{ dayjs().diff(dayjs(pet.dateOfBirth), 'year') }} ans </span>
            </div>
            <el-icon class="pet-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
        <p v-else class="empty-text">Aucun animal enregistré</p>
      </div>

      <div class="section">
        <h3 class="section-label">
          <el-icon><Calendar /></el-icon>
          Derniers rendez-vous
        </h3>

        <div v-if="meetings.length" class="meetings-list">
          <div
            v-for="meeting in meetings.slice(0, 5)"
            :key="meeting.meeting.id"
            class="meeting-row"
            @click="
              router.push({
                name: 'Secretary.Calendar.Meeting.Detail',
                params: { id: meeting.meeting.id },
              })
            "
          >
            <div class="meeting-date">
              <span class="meeting-day">
                {{ dayjs(meeting.meeting?.date).format('D MMM') }}
              </span>
              <span class="meeting-year">
                {{ dayjs(meeting.meeting?.date).format('YYYY') }}
              </span>
            </div>
            <div class="meeting-info">
              <span class="meeting-pet">{{ meeting.animal.name }}</span>
              <span class="meeting-desc">{{ meeting.description ?? 'Consultation' }}</span>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
        <p v-else class="empty-text">Aucun rendez-vous</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.client-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);

  @include above('lg') {
    flex-direction: row;
    align-items: flex-start;
  }
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

.client-left {
  width: 100%;

  @include above('lg') {
    width: 280px;
    flex-shrink: 0;
  }
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl) var(--spacing-lg);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-xl);
  background: var(--el-bg-color);
  box-sizing: border-box;
  width: 100%;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: var(--fw-bold);
}

.profile-name {
  font-size: 20px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0;
  text-align: center;
}

.profile-role {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 2px 10px;
  border-radius: var(--radius-full);
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  width: 100%;
  margin-top: var(--spacing-sm);
}

.detail-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 13px;
  color: var(--el-text-color-secondary);

  .el-icon {
    flex-shrink: 0;
    color: var(--el-text-color-placeholder);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

.client-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

// ── Animaux ───────────────────────────────────────────────────────────────────

.pets-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-sm);

  @include above('sm') {
    grid-template-columns: repeat(2, 1fr);
  }

  @include above('xl') {
    grid-template-columns: repeat(3, 1fr);
  }
}

.pet-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-lg);
  background: var(--el-bg-color);
  cursor: pointer;
  transition: background 0.15s;
  box-sizing: border-box;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.pet-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--el-color-success-light-7);
  color: var(--el-color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: var(--fw-bold);
  flex-shrink: 0;
}

.pet-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.pet-name {
  font-size: 14px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pet-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.pet-arrow {
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}

// ── Rendez-vous ───────────────────────────────────────────────────────────────

.meetings-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.meeting-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-md);
  background: var(--el-bg-color);
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.meeting-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 44px;
}

.meeting-day {
  font-size: 14px;
  font-weight: var(--fw-bold);
  color: var(--el-color-primary);
}

.meeting-year {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.meeting-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meeting-pet {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}

.meeting-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
