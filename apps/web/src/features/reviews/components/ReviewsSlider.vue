<script setup lang="ts">
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { reviewApi } from '../review.api'
import ReviewCard from './ReviewCard.vue'

const track = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const isLoading = ref(true)
const hasError = ref(false)

const reviews = ref<Awaited<ReturnType<typeof reviewApi.getAll>>>([])

const hasOverflow = computed(() => canScrollLeft.value || canScrollRight.value)

const updateArrows = () => {
  const el = track.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 4
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

const scrollBy = (direction: 1 | -1) => {
  const el = track.value
  if (!el) return
  const card = el.querySelector<HTMLElement>('.review-slide')
  const step = (card?.offsetWidth ?? 280) + 16
  el.scrollBy({ left: direction * step, behavior: 'smooth' })
}

let resizeObserver: ResizeObserver | undefined

onMounted(async () => {
  try {
    reviews.value = await reviewApi.getAll()
  } catch (error) {
    console.error('Erreur lors du chargement des avis', error)
    hasError.value = true
  } finally {
    isLoading.value = false
  }

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
    <div v-if="isLoading" class="reviews-slider-empty">Chargement des avis…</div>

    <div v-else-if="hasError" class="reviews-slider-empty">
      Impossible de charger les avis pour le moment.
    </div>

    <div v-else-if="reviews.length === 0" class="reviews-slider-empty">
      Aucun avis pour le moment.
    </div>

    <template v-else>
      <div v-if="hasOverflow" class="reviews-slider-nav">
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

      <div ref="track" class="reviews-slider-track" @scroll="updateArrows">
        <div v-for="review in reviews" :key="review.id" class="review-slide">
          <ReviewCard :review="review" />
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.reviews-slider {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  height: 400px;
}

.reviews-slider-nav {
  display: flex;
  justify-content: flex-end;
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

  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.review-slide {
  scroll-snap-align: start;
  flex: 0 0 auto;
  width: 280px;
  height: 100%;
}
</style>
