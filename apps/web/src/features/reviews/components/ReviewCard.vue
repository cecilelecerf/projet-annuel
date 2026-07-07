<script setup lang="ts">
import { reviewApi } from '@/features/reviews/review.api'
import { useAuthStore } from '@/stores/authStore'
import type { BaseUser, Clinic, VeterinarianClinicId } from '@armali/schemas'
import { StarFilled } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

const { veterinarianClinicId, veterinarian } = defineProps<{
  veterinarianClinicId: VeterinarianClinicId
  client: BaseUser
  veterinarian: BaseUser
  clinic: Clinic
}>()
const { user } = storeToRefs(useAuthStore())
const review = await reviewApi.getByVetoAndClient({ veterinarianClinicId })
const initials = computed(() => `${veterinarian.firstname[0]}${veterinarian.lastname[0]}`)

const isClient = computed(() => user.value?.role === 'CLIENT')

const localRating = ref(review?.rating ?? 0)
const localComment = ref(review?.comment ?? '')
const localCreatedAt = ref(review?.createdAt)

const onVote = async (value: number) => {
  localRating.value = value
  const updated = await reviewApi.upsert({
    payload: {
      veterinarianClinicId,
      rating: value,
      comment: localComment.value || undefined,
    },
  })
  localCreatedAt.value = updated.createdAt
}

const onCommentChange = async () => {
  const updated = await reviewApi.upsert({
    payload: {
      veterinarianClinicId,
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
        style="
          background: var(--el-color-purple-light-7, #eeedfe);
          color: var(--el-color-purple, #9f6de0);
          font-weight: 700;
          font-size: 16px;
        "
      >
        {{ initials }}
      </el-avatar>

      <div class="vet-review-identity">
        <span class="vet-review-name"
          >{{ veterinarian.lastname }} {{ veterinarian.firstname }}</span
        >
        <span class="vet-review-clinic">{{ clinic.name }}</span>
      </div>
    </div>
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

    <div class="vet-review-body">
      <el-input
        v-if="isClient"
        v-model="localComment"
        type="textarea"
        :rows="2"
        placeholder="Laisser un commentaire sur ce vétérinaire..."
        maxlength="500"
        show-word-limit
        @change="onCommentChange"
      />
      <p class="vet-review-comment" v-else-if="localComment">{{ localComment }}</p>
    </div>

    <div class="vet-review-footer" v-if="localCreatedAt">
      <span class="vet-review-date">{{ localCreatedAt }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.vet-review-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition: all 0.15s;
  flex: 1;
  width: 100%;
  @include below('sm') {
    max-width: 360px;
    margin: 0 auto;
  }
  @include above('sm') {
    min-width: 175px;
  }
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

.vet-review-comment {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  margin: 0;
}

.vet-review-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--el-border-color-lighter);
}

.vet-review-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);

  strong {
    color: var(--el-text-color-primary);
    font-weight: 600;
  }
}

.vet-review-date {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}
</style>
