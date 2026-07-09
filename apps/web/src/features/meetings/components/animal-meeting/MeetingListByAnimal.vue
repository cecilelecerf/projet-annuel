<script setup lang="ts">
import { meetingApi } from '@/features/meetings/api/meeting.api'
import type { AnimalId } from '@armali/schemas'
import dayjs from 'dayjs'
import MeetingCard from './MeetingCard.vue'
dayjs.locale('fr')

const props = defineProps<{ animalId: AnimalId }>()
const meetings = await meetingApi.animal.getAllByAnimal(props.animalId)
</script>
<template>
  <!-- Historique des RDV -->
  <div class="section">
    <h3 class="section-label">
      Historique des rendez-vous
      <span class="count-badge">{{ meetings.length ?? 0 }}</span>
    </h3>
    <div v-if="meetings?.length" class="meetings-list">
      <MeetingCard
        v-for="meeting in meetings.sort((a, b) =>
          dayjs(b.meeting?.date).diff(dayjs(a.meeting?.date)),
        )"
        :animal-meeting="meeting"
        :key="meeting.animalId"
        status="PAST"
      />
    </div>
    <p v-else class="empty-text">Aucun rendez-vous</p>
  </div>
</template>
