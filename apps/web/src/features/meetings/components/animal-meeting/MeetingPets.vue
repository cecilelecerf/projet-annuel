<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/authStore'
import type { AnimalMeetingMeta } from '@armali/schemas'
import VetoCard from './VetoCard.vue'
import ContactCard from '@/components/ContactCard.vue'
import { useBelowBreakpoint as useBreakpoint } from '@/composables/useBreakpoint.ts'

const props = defineProps<{ meeting: AnimalMeetingMeta }>()
const { user } = useAuthStore()
const isBelowSm = useBreakpoint('lg')

const petAge = computed(() => {
  const years = dayjs().diff(dayjs(props.meeting.animal.dateOfBirth), 'year')
  const months = dayjs().diff(dayjs(props.meeting.animal.dateOfBirth), 'month') % 12
  if (years === 0) return `${months} mois`
  if (months === 0) return `${years} an${years > 1 ? 's' : ''}`
  return `${years} an${years > 1 ? 's' : ''} et ${months} mois`
})
const cardDirection = computed(() => (isBelowSm.isAbove.value ? 'row' : 'column'))
</script>

<template>
  <div class="container">
    <ContactCard
      :initial="meeting.animal?.name?.charAt(0) ?? '?'"
      :name="meeting.animal.name"
      :route="{
        name: `${user?.role.toUpperCase()}.Animals.Detail`,
        params: { id: meeting.animal.id },
      }"
      :metas="[
        `${meeting.animal.race.pet.name} ${meeting.animal.race.name}`,
        petAge && `${petAge}`,
      ]"
      :direction="cardDirection"
    />
    <ContactCard
      v-if="user?.role !== 'CLIENT'"
      :initial="meeting.animal.client.user.firstname?.charAt(0) ?? '?'"
      :name="`${meeting.animal.client.user.firstname} ${meeting.animal.client.user.lastname}`"
      :route="{
        name: `${user?.role.toUpperCase()}.Clients.Detail`,
        params: { id: meeting.animal.clientId },
      }"
      :avatar-url="meeting.animal.client.user.avatarUrl"
      :direction="cardDirection"
    />
    <VetoCard
      v-if="user?.role === 'CLIENT' && meeting.veterinarianClinicId"
      :veterinarian-clinic-id="meeting.veterinarianClinicId"
    />
  </div>
</template>

<style lang="scss" scoped>
.container {
  display: flex;
  @include below('sm') {
    flex-direction: column;
    flex-wrap: wrap;
  }

  gap: var(--spacing-md);
  width: 100%;
  // height: 200px;

  @include above('lg') {
    flex-direction: column;
    width: 300px;
    height: 100%;
  }
}
</style>
