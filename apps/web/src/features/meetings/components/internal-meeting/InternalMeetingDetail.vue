<script setup lang="ts">
import type { InternalMeetingMeta, UpdateInternalMeeting } from '@armali/schemas'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/fr'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ParticipantSection from './ParticipantSection.vue'
import DescriptionSection from './DescriptionSection.vue'
import DateTimeSection from './DateTimeSection.vue'
import TitleSection from './TitleSection.vue'
import { useAuthStore } from '@/stores/authStore.ts'
import HeaderMeetingSection from '../HeaderMeetingSection.vue'
import RecurringComponent from './RecurringComponent.vue'
import { useMeetingActions } from '../../composables/useMeetingActions.ts'
import { combineDateAndTime } from '../utils'

dayjs.extend(utc)
dayjs.locale('fr')

type Edit = Required<
  Omit<UpdateInternalMeeting, 'startTime' | 'endTime'> & {
    startTime: string
    endTime: string
  }
>

const { meeting } = defineProps<{
  meeting: InternalMeetingMeta
}>()
const router = useRouter()
const route = useRoute()
const { user } = useAuthStore()
const { saveSchedule, deleteMeeting, deleting } = useMeetingActions()

const showDeleteDialog = ref(false)
const pendingDeleteScope = ref<'single' | 'all'>('single')
const isEditing = ref(false)
const edit = ref<Edit>({
  title: meeting.title,
  description: meeting.description ?? '',
  startTime: dayjs.utc(meeting.startTime).format('HH:mm:ss'),
  endTime: dayjs.utc(meeting.endTime).format('HH:mm:ss'),
  date: meeting.date,
  userIds: meeting.participants.map((participant) => participant.userId),
})

const timeLabel = computed(() => {
  const start = dayjs.utc(meeting.startTime).format('H[h]mm')
  const end = dayjs.utc(meeting.endTime).format('H[h]mm')
  return `${start} — ${end}`
})

const isUpcoming = computed(() => {
  if (!meeting.date || !meeting.startTime) return false
  return combineDateAndTime(meeting.date, meeting.startTime) > new Date()
})

const onSave = async (scope: 'single' | 'all') => {
  await saveSchedule({
    meetingId: meeting.id,
    parentId: meeting.parentId ?? null,
    date: meeting.date,
    startTime: edit.value.startTime,
    endTime: edit.value.endTime,
    scope,
    internal: {
      title: edit.value.title,
      description: edit.value.description ?? '',
      userIds: edit.value.userIds,
    },
    onSuccess: (resultId) => {
      isEditing.value = false
      router.push({
        name: route.name,
        params: scope === 'all' ? { id: resultId } : { ...route.params, id: resultId },
        query: scope === 'all' && meeting.date ? { date: meeting.date.toISOString() } : undefined,
      })
    },
  })
}

function onDeleteRequested(scope: 'single' | 'all') {
  pendingDeleteScope.value = scope
  showDeleteDialog.value = true
}

async function onConfirmDelete() {
  await deleteMeeting({
    kind: 'INTERNAL',
    meetingId: meeting.id,
    date: meeting.date,
    scope: pendingDeleteScope.value,
    onSuccess: () => {
      showDeleteDialog.value = false
      router.back()
    },
  })
}
</script>

<template>
  <HeaderMeetingSection
    v-if="user"
    :editing="isEditing"
    :is-recurring-occurrence="!!meeting.parentId"
    :is-upcoming="isUpcoming"
    @back="router.back()"
    @edit="isEditing = true"
    @save="onSave"
    @cancel="isEditing = false"
    @delete="onDeleteRequested"
    :user="user"
  />

  <div class="meeting-content">
    <TitleSection v-model:title="edit.title" :editing="isEditing" />

    <DateTimeSection
      v-model:start-time="edit.startTime"
      v-model:end-time="edit.endTime"
      :editing="isEditing"
      :date="meeting.date"
      :time-label="timeLabel"
    />

    <DescriptionSection v-model:description="edit.description" :editing="isEditing" />

    <ParticipantSection :meeting="meeting" :participants="meeting.participants" />

    <RecurringComponent
      v-if="meeting.parentId"
      :recurring-id="meeting.parentId"
      :date="meeting.date"
    />
  </div>
  <ConfirmDeleteDialog
    v-model="showDeleteDialog"
    title="Supprimer le rendez-vous ?"
    message="Cette action est définitive et ne peut pas être annulée."
    :loading="deleting"
    @confirm="onConfirmDelete"
  />
</template>

<style scoped>
.meeting-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}
</style>
