<script setup lang="ts">
import { reviewApi } from '@/features/reviews/review.api'
import { useAuthStore } from '@/stores/authStore'
import type { ReviewMeta } from '@armali/schemas'
import { StarFilled } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
dayjs.locale('fr')

const { review } = defineProps<{
  review: ReviewMeta
}>()
const { user } = storeToRefs(useAuthStore())
const initials = computed(
  () => `${review.veterinarian.firstname[0]}${review.veterinarian.lastname[0]}`,
)

const isClient = computed(() => user.value?.role === 'CLIENT')
const formattedDate = computed(() => {
  if (!localCreatedAt.value) return ''
  return dayjs(localCreatedAt.value).format('D MMM YYYY')
})
const localRating = ref(review?.rating ?? 0)
const localComment = ref(review?.comment ?? '')
const localCreatedAt = ref(review?.createdAt)

const onVote = async (value: number) => {
  localRating.value = value
  const updated = await reviewApi.upsert({
    payload: {
      veterinarianClinicId: review.veterinarianClinicId,
      rating: value,
      comment: localComment.value || undefined,
    },
  })
  localCreatedAt.value = updated.createdAt
}

const onCommentChange = async () => {
  const updated = await reviewApi.upsert({
    payload: {
      veterinarianClinicId: review.veterinarianClinicId,
      rating: localRating.value,
      comment: localComment.value || undefined,
    },
  })
  localCreatedAt.value = updated.createdAt
}
</script>

<template>
  <div class="vet-review-card">
    <div class="vet-review-header">
      <el-avatar
        :size="48"
        :src="review.veterinarian.avatarUrl ?? undefined"
        style="
          background: var(--el-color-purple-light-7, #eeedfe);
          color: var(--el-color-purple, #9f6de0);
          font-weight: 700;
          font-size: 16px;
        "
      >
        <template v-if="!review.veterinarian.avatarUrl">{{ initials }}</template>
      </el-avatar>

      <div class="vet-review-identity">
        <span class="vet-review-name"
          >{{ review.veterinarian.lastname }} {{ review.veterinarian.firstname }}</span
        >
        <span class="vet-review-clinic">{{ review.clinic.name }}</span>
      </div>
    </div>
    <el-row class="score-row">
      <div class="vet-review-score">
        <el-rate
          v-model="localRating"
          :disabled="!isClient"
          allow-half
          @change="onVote"
          :icons="[StarFilled, StarFilled, StarFilled]"
          void-icon-class="el-icon-star-void"
          class="vet-review-stars"
        />
        <span class="vet-review-score-value" v-if="localRating">{{ localRating.toFixed(1) }}</span>
      </div>
      <p class="vet-review-date">{{ formattedDate }}</p>
    </el-row>

    <div class="vet-review-body">
      <el-input
        v-if="isClient"
        v-model="localComment"
        type="textarea"
        placeholder="Laisser un commentaire sur ce vétérinaire..."
        maxlength="500"
        show-word-limit
        class="vet-review-input"
        @change="onCommentChange"
      />
      <p class="vet-review-comment" v-else-if="localComment">{{ localComment }}</p>
      <p class="vet-review-comment" v-else>Pas de commentaire</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.vet-review-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  background: var(--el-bg-color);
  transition: all 0.15s;
  flex: 1;
  width: 100%;
  height: 100%;
  box-shadow: var(--shadow-xs);
  transition: all 0.25s;
  justify-content: space-between;
  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-4px);
  }
  @include below('sm') {
    max-width: 360px;
    margin: 0 auto;
  }
  @include above('sm') {
    min-width: 175px;
  }
}
.score-row {
  justify-content: space-between;
  align-items: center;
}
.vet-review-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.vet-review-identity {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.vet-review-name {
  font-family: 'Nunito', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.vet-review-clinic {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vet-review-score {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.vet-review-stars {
  :deep(.el-rate__icon) {
    font-size: 16px;
    margin-right: 2px;
  }

  :deep(.el-rate__decimal),
  :deep(.el-icon-star-on) {
    color: var(--el-color-warning);
  }
}

.vet-review-score-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.vet-review-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}
.vet-review-comment {
  font-size: 13px;
  color: var(--el-text-color-primary);
  margin: 0;
  height: 100%;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
}

.vet-review-date {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.vet-review-input {
  height: 100%;

  :deep(.el-textarea__inner) {
    height: 100%;
    resize: none; // évite que l'utilisateur agrandisse manuellement et casse le layout
  }
}
</style>
