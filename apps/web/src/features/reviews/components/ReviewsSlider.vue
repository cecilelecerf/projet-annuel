<script setup lang="ts">
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { reviewApi } from '../review.api'
import ReviewCard from './ReviewCard.vue'

const track = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const reviews = await reviewApi.getAll()

const updateArrows = () => {
  const el = track.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 4
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}
const title = undefined
const scrollBy = (direction: 1 | -1) => {
  const el = track.value
  if (!el) return
  const card = el.querySelector<HTMLElement>('.review-slide')
  const step = (card?.offsetWidth ?? 280) + 16
  el.scrollBy({ left: direction * step, behavior: 'smooth' })
}

let resizeObserver: ResizeObserver | undefined

onMounted(async () => {
  await nextTick()
  updateArrows()
  if (track.value) {
    resizeObserver = new ResizeObserver(updateArrows)
    resizeObserver.observe(track.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="reviews-slider">
    <div class="reviews-slider-header" v-if="title || reviews.length > 0">
      <span class="reviews-slider-title">Mes avis clients</span>
      <div class="reviews-slider-nav">
        <button
          class="reviews-slider-arrow"
          :disabled="!canScrollLeft"
          aria-label="Avis précédents"
          @click="scrollBy(-1)"
        >
          <el-icon><ArrowLeft /></el-icon>
        </button>
        <button
          class="reviews-slider-arrow"
          :disabled="!canScrollRight"
          aria-label="Avis suivants"
          @click="scrollBy(1)"
        >
          <el-icon><ArrowRight /></el-icon>
        </button>
      </div>
    </div>

    <div v-if="reviews.length === 0" class="reviews-slider-empty">Aucun avis pour le moment.</div>

    <div v-else ref="track" class="reviews-slider-track" @scroll="updateArrows">
      <div v-for="review in reviews" :key="review.id" class="review-slide">
        <ReviewCard
          :veterinarian="review.veterinarian"
          :client="review.client"
          :veterinarian-clinic-id="review.veterinarianClinicId"
          :clinic="review.clinic"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.reviews-slider {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  width: 100%;
  box-shadow: var(--shadow-md);
  background: var(--el-bg-color);
}

.reviews-slider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reviews-slider-title {
  font-family: 'Nunito', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.reviews-slider-nav {
  display: flex;
  gap: var(--spacing-xs);
}

.reviews-slider-arrow {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    border-color: var(--el-color-primary-light-5);
    color: var(--el-color-primary);
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
}

.reviews-slider-empty {
  padding: var(--spacing-xl);
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  border: 1px dashed var(--el-border-color);
  border-radius: var(--radius-lg);
}

.reviews-slider-track {
  display: flex;
  gap: var(--spacing-md);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  padding-bottom: var(--spacing-xs);

  // Masque la scrollbar tout en gardant le scroll fonctionnel
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.review-slide {
  scroll-snap-align: start;
  flex: 0 0 auto;
  width: 280px;
}
</style>
