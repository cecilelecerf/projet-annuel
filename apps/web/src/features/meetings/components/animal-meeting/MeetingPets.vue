<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import dayjs from 'dayjs'
import type { AnimalMeetingMeta } from '@armali/schemas'
import { useAuthStore } from '@/stores/authStore'

const props = defineProps<{ meeting: AnimalMeetingMeta }>()
const { user } = useAuthStore()
const router = useRouter()
const petAge = computed(() => {
  if (!props.meeting.animal?.dateOfBirth) return null
  const years = dayjs().diff(dayjs(props.meeting.animal.dateOfBirth), 'year')
  const months = dayjs().diff(dayjs(props.meeting.animal.dateOfBirth), 'month') % 12
  if (years === 0) return `${months} mois`
  if (months === 0) return `${years} an${years > 1 ? 's' : ''}`
  return `${years} an${years > 1 ? 's' : ''} et ${months} mois`
})
</script>

<template>
  <div class="pet-card">
    <div class="pet-avatar">{{ meeting.animal?.name?.charAt(0) ?? '?' }}</div>
    <div class="pet-section">
      <p class="pet-info">
        <span class="pet-name">{{ meeting.animal?.name }}</span>
        <span class="pet-meta">
          {{ meeting.animal?.race?.pet?.name }} · {{ meeting.animal?.race?.name }}
        </span>
        <span v-if="petAge" class="pet-meta">{{ petAge }}</span>
      </p>
      <el-button
        text
        size="small"
        @click="
          router.push({
            name: `${user?.role.toUpperCase()}.Animals.Detail`,
            params: { id: meeting.animal.id },
          })
        "
      >
        Voir la fiche <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>
  </div>

  <div class="pet-card" v-if="user?.role !== 'CLIENT'">
    <div class="pet-avatar">
      {{ meeting.animal?.client?.firstname?.charAt(0) ?? '?' }}
    </div>
    <p class="pet-info">
      <span class="pet-name">
        {{ meeting.animal?.client?.firstname }} {{ meeting.animal?.client?.lastname }}
      </span>
    </p>
    <el-button
      text
      size="small"
      @click="
        router.push({
          name: `${user?.role.toUpperCase()}.Clients.Detail`,
          params: { id: meeting.animal.clientId },
        })
      "
    >
      Voir la fiche <el-icon><ArrowRight /></el-icon>
    </el-button>
  </div>
</template>

<style lang="scss" scoped>
.pet-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  width: 100%;
  box-sizing: border-box;
}

.pet-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.pet-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--el-color-success-light-7);
  color: var(--el-color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: var(--fw-bold);
}

.pet-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
}

.pet-name {
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  text-align: center;
}

.pet-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
}
</style>
