<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/authStore'
import type { AnimalMeetingMeta } from '@armali/schemas'
import ContactCard from './ContactCard.vue'
import ReviewCard from '../../../reviews/components/ReviewCard.vue'

const props = defineProps<{ meeting: AnimalMeetingMeta }>()
const { user } = useAuthStore()
const petAge = computed(() => {
  const years = dayjs().diff(dayjs(props.meeting.animal.dateOfBirth), 'year')
  const months = dayjs().diff(dayjs(props.meeting.animal.dateOfBirth), 'month') % 12
  if (years === 0) return `${months} mois`
  if (months === 0) return `${years} an${years > 1 ? 's' : ''}`
  return `${years} an${years > 1 ? 's' : ''} et ${months} mois`
})
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
    />
    <ContactCard
      v-if="user?.role !== 'CLIENT'"
      :initial="meeting.animal?.client?.firstname?.charAt(0) ?? '?'"
      :name="`${meeting.animal.client.firstname} ${meeting.animal.client.lastname}`"
      :route="{
        name: `${user?.role.toUpperCase()}.Clients.Detail`,
        params: { id: meeting.animal.clientId },
      }"
    />
    <ReviewCard
      v-if="meeting.veterinarianClinic && meeting.veterinarianClinicId"
      :veterinarian-clinic-id="meeting.veterinarianClinicId"
      :client="meeting.animal.client"
      :veterinarian="meeting.veterinarianClinic?.veterinarian.user"
      :clinic="meeting.veterinarianClinic?.clinic"
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

  @include above('lg') {
    flex-direction: column;
    width: 300px;
  }
}
</style>
