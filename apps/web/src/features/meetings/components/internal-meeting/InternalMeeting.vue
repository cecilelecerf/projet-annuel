<script setup lang="ts">
import type { InternalMeetingMeta, UpdateInternalMeeting } from '@armali/schemas'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RecurringComponent from '../RecurringComponent.vue'
import ParticipantSection from './ParticipantSection.vue'
import DescriptionSection from './DescriptionSection.vue'
import DateTimeSection from './DateTimeSection.vue'
import TitleSection from './TitleSection.vue'
import HeaderSection from './HeaderSection.vue'
import { calendarApi } from '../../api/calendar.api.ts'
import { useFormErrorStore } from '@/stores/formErrorStore.ts'
import { ElMessage } from 'element-plus'

dayjs.locale('fr')

const { meeting } = defineProps<{
  meeting: InternalMeetingMeta
}>()
const router = useRouter()
const route = useRoute()

const { handle } = useFormErrorStore()
const showDeleteDialog = ref(false)
const deleting = ref(false)
const isEditing = ref(false)
const edit = ref<
  Required<Omit<UpdateInternalMeeting, 'startTime' | 'endTime'>> & {
    startTime: string
    endTime: string
  }
>({
  title: meeting.title,
  description: meeting.description ?? '',
  startTime: dayjs(meeting.startTime).toISOString(),
  endTime: dayjs(meeting.endTime).toISOString(),
  parentId: meeting.parentId,
  date: meeting.date,
  userIds: meeting.participants.map((participant) => participant.userId),
})

const dateLabel = computed(() => dayjs(meeting.date).format('dddd D MMMM YYYY'))

const timeLabel = computed(() => {
  const start = dayjs(meeting.startTime).format('H[h]mm')
  const end = dayjs(meeting.endTime).format('H[h]mm')
  return `${start} — ${end}`
})

const onSave = async (scope: 'single' | 'all') => {
  if (scope === 'all' && meeting.parentId) {
    try {
      const result = await calendarApi.recurring.update(meeting.parentId, {
        dateToStartAction: meeting.date,
        startTime: dayjs(edit.value.startTime).toDate(),
        endTime: dayjs(edit.value.endTime).toDate(),
        internal: {
          title: edit.value.title,
          description: edit.value.description,
          userIds: edit.value.userIds,
        },
      })
      isEditing.value = false

      router.push({
        name: route.name,
        params: { id: result.id },
        query: meeting.date ? { date: meeting.date.toISOString() } : undefined,
      })
    } catch (err) {
      console.log(err)
      handle(err)
    }
  } else {
    try {
      const result = await calendarApi.internal.update(meeting.id, {
        ...edit.value,
        startTime: dayjs(edit.value.startTime).toDate(),
        endTime: dayjs(edit.value.endTime).toDate(),
      })
      isEditing.value = false

      router.push({
        name: route.name,
        params: { ...route.params, id: result.meeting.id },
      })
    } catch (err) {
      console.log(err)
      handle(err)
    }
  }
}

async function onDelete() {
  deleting.value = true
  try {
    await calendarApi.delete(meeting.id, meeting.date.toISOString())
    ElMessage.success('Rendez-vous supprimé')
    showDeleteDialog.value = false
    router.back()
  } catch {
    ElMessage.error('Erreur lors de la suppression')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <HeaderSection
    :editing="isEditing"
    :is-recurring-occurrence="!!meeting.parentId && String(meeting.parentId) === String(meeting.id)"
    @back="router.back()"
    @edit="isEditing = true"
    @save="onSave"
    @cancel="isEditing = false"
    @delete="showDeleteDialog = true"
  />

  <div class="meeting-content">
    <TitleSection v-model:title="edit.title" :editing="isEditing" />

    <DateTimeSection
      v-model:start-time="edit.startTime"
      v-model:end-time="edit.endTime"
      :editing="isEditing"
      :date-label="dateLabel"
      :time-label="timeLabel"
    />

    <DescriptionSection v-model:description="edit.description" :editing="isEditing" />

    <ParticipantSection :participants="meeting.participants" />

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
    @confirm="onDelete"
  />
</template>

<style scoped>
.meeting-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}
</style>
