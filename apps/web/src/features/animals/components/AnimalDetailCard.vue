<script lang="ts" setup>
import type { AnimalDetail, AnimalMeetingWithMeeting } from '@armali/schemas'
import dayjs from 'dayjs'
import { computed } from 'vue'

const { meetings, animal } = defineProps<{
  animal: AnimalDetail
  meetings: AnimalMeetingWithMeeting[]
}>()
const age = computed(() => {
  const years = dayjs().diff(dayjs(animal.dateOfBirth), 'year')
  const months = dayjs().diff(dayjs(animal.dateOfBirth), 'month') % 12
  if (years === 0) return `${months} mois`
  if (months === 0) return `${years} an${years > 1 ? 's' : ''}`
  return `${years} an${years > 1 ? 's' : ''} et ${months} mois`
})

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
const lastWeight = computed(() => {
  const meetingFiler = weightData.value?.filter((m) => m.poids != null)
  const last = meetingFiler.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))[
    meetingFiler.length - 1
  ]
  return last ? `${last.poids} kg` : '—'
})

const lastSize = computed(() => {
  const filetMeeting = meetings?.filter((m) => m.petSize != null)
  const last = filetMeeting.sort((a, b) => dayjs(a.meeting?.date).diff(dayjs(b.meeting?.date)))[
    filetMeeting.length - 1
  ]
  return last ? `${Number(last.petSize)} cm` : '—'
})
</script>

<template>
  <div class="profile-card">
    <div class="pet-avatar">{{ animal.name.charAt(0) }}</div>
    <h2 class="profile-name">{{ animal.name }}</h2>
    <span class="profile-breed"> {{ animal.race?.pet?.name }} · {{ animal.race?.name }} </span>

    <div class="profile-details">
      <div class="detail-row">
        <span class="detail-label">Âge</span>
        <span class="detail-value">{{ age }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Poids</span>
        <span class="detail-value">{{ lastWeight }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Taille</span>
        <span class="detail-value">{{ lastSize }}</span>
      </div>
      <div v-if="animal.activity" class="detail-row">
        <span class="detail-label">Activité</span>
        <el-rate :model-value="animal.activity / 2" disabled :max="5" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
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

.pet-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--el-color-success-light-7);
  color: var(--el-color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: var(--fw-bold);
}

.profile-name {
  font-size: 22px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.profile-breed {
  font-size: 13px;
  color: var(--el-text-color-secondary);
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
  justify-content: space-between;
  font-size: 13px;
}

.detail-label {
  color: var(--el-text-color-secondary);
}

.detail-value {
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}
</style>
