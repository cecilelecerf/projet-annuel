<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useRouter } from 'vue-router'
import type { AnimalMeetingWithMeeting } from '@armali/schemas'
import { MEETING_COLORS } from '@/utils/meetingColor.ts'
import type { MeetingStatus } from '../../views/ListAnimalMeetingView.vue'
import { subtractTime } from '../utils.ts'

dayjs.extend(utc)

const { animalMeeting } = defineProps<{
  status: MeetingStatus
  animalMeeting: AnimalMeetingWithMeeting
}>()

const router = useRouter()
const { user } = useAuthStore()

function goToMeeting() {
  router.push({
    name: `${user?.role.toUpperCase()}.Meetings.Detail`,
    params: { id: animalMeeting.meeting.id },
  })
}
</script>
<template>
  <div class="meeting-card" :class="status" @click="goToMeeting()">
    <div class="card-left">
      <div class="date-block">
        <span class="date-day">{{ dayjs(animalMeeting.meeting.date).format('D') }}</span>
        <span class="date-month">{{ dayjs(animalMeeting.meeting.date).format('MMM') }}</span>
      </div>
    </div>

    <div class="card-body">
      <div class="card-top">
        <span class="animal-name">{{ animalMeeting.animal.name }}</span>
        <span class="animal-race"
          >{{ animalMeeting.animal.race.pet.name }} · {{ animalMeeting.animal.race.name }}</span
        >
      </div>
      <div class="card-meta">
        <span class="meta-item">
          <el-icon><Clock /></el-icon>
          {{ subtractTime(animalMeeting.meeting.startTime, animalMeeting.meeting.endTime) }}
        </span>
        <span class="meta-item">
          <el-icon><User /></el-icon>
          Dr {{ animalMeeting.veterinarianClinic.veterinarian.lastname }}
        </span>
      </div>
      <div class="card-bottom">
        <el-tag
          :type="animalMeeting.speciality ? MEETING_COLORS.ANIMAL : 'info'"
          size="small"
          round
        >
          {{ animalMeeting.speciality?.name ?? 'Consultation générale' }}
        </el-tag>
        <span class="clinic-name">{{ animalMeeting.veterinarianClinic.clinic.name }}</span>
      </div>
    </div>

    <div class="card-right">
      <el-tag :type="status === 'PAST' ? 'info' : 'success'" size="small" round>{{
        status === 'PAST' ? 'Passé' : 'À venir'
      }}</el-tag>
    </div>
  </div>
</template>
<style scoped lang="scss">
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
    border-color: var(--el-color-#{meeting-color('animal')}-light-5);
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
  background: var(--el-color-#{meeting-color('animal')}-light-9);
  border: 1px solid var(--el-color-#{meeting-color('animal')}-light-7);

  &.past {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color-lighter);
  }
}

.date-day {
  font-size: 20px;
  font-weight: var(--fw-bold);
  color: var(--el-color-#{meeting-color('animal')});
  line-height: 1;

  .past & {
    color: var(--el-text-color-secondary);
  }
}

.date-month {
  font-size: 11px;
  font-weight: var(--fw-semibold);
  color: var(--el-color-#{meeting-color('animal')}-light-3);
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
</style>
