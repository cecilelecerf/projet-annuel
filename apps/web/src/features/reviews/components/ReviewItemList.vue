<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import type { BaseUser, ReviewStat } from '@armali/schemas'
import { useRouter } from 'vue-router'

defineProps<{ stat: ReviewStat; veterinarian: BaseUser }>()
const router = useRouter()
const { user } = useAuthStore()
</script>

<template>
  <div
    :key="veterinarian.id"
    class="vet-stat-item"
    @click="
      router.push({
        name: `${user?.role.toUpperCase()}.Staff.Detail`,
        params: { id: veterinarian.id },
      })
    "
  >
    <span class="vet-name">{{ veterinarian.firstname }} {{ veterinarian.lastname }}</span>
    <div class="vet-rating">
      <template v-if="stat.count !== 0 && stat.average">
        <el-rate :model-value="stat.average" disabled allow-half />
        <span class="rating-value">{{ stat.average }}</span>
        <span class="rating-count">({{ stat.count }})</span>
      </template>
      <span v-else class="no-rating">Aucun avis</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.vet-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  padding-inline: var(--spacing-md);
  border-bottom: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-md);
  transition: background 0.5s;
  &:hover {
    background: var(--el-fill-color-light);
  }
}
.vet-stat-item:last-child {
  border-bottom: none;
}
.vet-name {
  font-size: 14px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}
.vet-rating {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.rating-value {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}
.rating-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.no-rating {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
