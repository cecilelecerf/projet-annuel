<script setup lang="ts">
import { computed, watch } from 'vue'
import type { ClinicId, VeterinarianId } from '@armali/schemas'
import TimelineBar from './TimelineBar.vue'
import TimelineLegend from './TimelineLegend.vue'
import TimeRangeInputs from './TimeRangeInputs.vue'
import { useAvailabilityTimeline } from '@/features/meetings/composables/useAvailabilityTimeline.ts'

const props = defineProps<{
  veterinarianId: VeterinarianId | undefined
  clinicId: ClinicId | undefined
  date: Date
}>()

const start = defineModel<string>('start', { required: true })
const end = defineModel<string>('end', { required: true })
const isValid = defineModel<boolean>('isValid', { default: false })

const veterinarianIdRef = computed(() => props.veterinarianId)
const clinicIdRef = computed(() => props.clinicId)
const dateRef = computed(() => props.date)

const { timeline, loading, segments, isRangeValid, timeToPercent } = useAvailabilityTimeline({
  veterinarianId: veterinarianIdRef,
  clinicId: clinicIdRef,
  date: dateRef,
})

const hasSelection = computed(() => !!start.value && !!end.value)

const currentIsValid = computed(() => {
  if (!hasSelection.value) return false
  return isRangeValid(start.value, end.value)
})

// Fait remonter la validité au parent (bouton "Créer" en dépend)
watch(
  currentIsValid,
  (v) => {
    isValid.value = v
  },
  { immediate: true },
)

watch(timeline, () => {
  if (hasSelection.value && !isRangeValid(start.value, end.value)) {
    start.value = ''
    end.value = ''
  }
})

const selection = computed(() => {
  if (!hasSelection.value) return null
  const startPercent = timeToPercent(start.value)
  const endPercent = timeToPercent(end.value)
  return {
    startPercent,
    widthPercent: Math.max(0, endPercent - startPercent),
    isValid: currentIsValid.value,
  }
})
</script>

<template>
  <div class="availability-timeline">
    <el-skeleton v-if="loading" :rows="1" animated />
    <TimelineBar v-else :segments="segments" :selection="selection" />

    <TimelineLegend />

    <TimeRangeInputs
      v-model:start="start"
      v-model:end="end"
      :is-valid="currentIsValid"
      :has-selection="hasSelection"
    />
  </div>
</template>

<style lang="scss" scoped>
.availability-timeline {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
</style>
