<script setup lang="ts">
import { StarFilled } from '@element-plus/icons-vue'
import { computed, onMounted, ref } from 'vue'
import { reviewApi } from '../review.api'
import ReviewsSlider from './ReviewsSlider.vue'

const isLoading = ref(true)
const hasError = ref(false)
const stat = ref<Awaited<ReturnType<typeof reviewApi.getStat>> | null>(null)

const averageLabel = computed(() => {
  if (!stat.value || stat.value.count === 0) return '—'
  return stat.value.average ? stat.value.average.toFixed(1) : null
})

onMounted(async () => {
  try {
    stat.value = await reviewApi.getStat()
  } catch (error) {
    console.error("Erreur lors du chargement des statistiques d'avis", error)
    hasError.value = true
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="reviews-summary">
    <div class="reviews-summary-header">
      <span class="reviews-summary-title">Mes avis clients</span>
      <div v-if="!isLoading && !hasError" class="reviews-summary-stats">
        <span class="reviews-summary-average" v-if="averageLabel">
          <el-icon><StarFilled /></el-icon>
          {{ averageLabel }}
        </span>
        <span class="reviews-summary-count">{{ stat?.count ?? 0 }} avis</span>
      </div>
    </div>

    <ReviewsSlider />
  </div>
</template>

<style lang="scss" scoped>
.reviews-summary {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  width: 100%;
}

.reviews-summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.reviews-summary-title {
  font-family: 'Nunito', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.reviews-summary-stats {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.reviews-summary-average {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: var(--el-color-warning);
}
</style>
