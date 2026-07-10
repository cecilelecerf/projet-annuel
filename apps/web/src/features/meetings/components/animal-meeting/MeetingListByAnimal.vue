<script setup lang="ts">
import type { AnimalMeetingWithMeeting, ClientId } from '@armali/schemas'
import dayjs from 'dayjs'
import MeetingCard from './AnimalMeetingCard.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore.ts'
import { match } from 'ts-pattern'
dayjs.locale('fr')

const router = useRouter()
const { user } = useAuthStore()
const props = defineProps<{
  meetings: AnimalMeetingWithMeeting[]
  clientId: ClientId
}>()

const onHandleMore = () =>
  router.push(
    match(user?.role)
      .with('CLIENT', () => ({ name: 'CLIENT.Mettings.List' }))
      .when(
        (r) => r === 'SECRETARY' || r === 'VETERINARIAN',
        (r) => ({
          name: `${r.toUpperCase()}.Clients.Meetings.List`,
          params: { id: props.clientId },
        }),
      )
      .otherwise(() => ({})),
  )
</script>
<template>
  <!-- Historique des RDV -->
  <div class="">
    <div class="section-header">
      <h3 class="section-label">
        Historique des rendez-vous
        <span class="count-badge">{{ meetings.length ?? 0 }}</span>
      </h3>
      <el-button plain v-if="meetings.length" @click="onHandleMore()">Voir +</el-button>
    </div>
    <div v-if="meetings?.length" class="meetings-list">
      <MeetingCard
        v-for="meeting in meetings
          .sort((a, b) => dayjs(b.meeting?.date).diff(dayjs(a.meeting?.date)))
          .slice(0, 5)"
        :animal-meeting="meeting"
        :key="meeting.animalId"
        status="PAST"
      />
    </div>
    <p v-else class="empty-text">Aucun rendez-vous</p>
  </div>
</template>
<style lang="scss" scoped>
.meetings-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}
</style>
