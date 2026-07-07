<script lang="ts" setup>
import ReviewCard from '@/features/reviews/components/ReviewCard.vue'
import { reviewApi } from '@/features/reviews/review.api'
import type { VeterinarianClinicId } from '@armali/schemas'
const { veterinarianClinicId } = defineProps<{ veterinarianClinicId: VeterinarianClinicId }>()
const review = await reviewApi.getByVetoAndClient({ veterinarianClinicId })
</script>
<template>
  <ReviewCard v-if="review" :review="review" />
</template>
