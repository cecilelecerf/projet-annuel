<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'
import { useFormErrorStore } from '@/stores/formErrorStore'
import { calendarApi } from '../../api/calendar.api'
import { prescriptionApi } from '@/features/prescriptions/api'
import MeetingHeader from './MeetingHeader.vue'
import MeetingPets from './MeetingPets.vue'
import MeetingInfo from './MeetingInfo.vue'
import MeetingActs from './MeetingActs.vue'
import MeetingPrescriptions from './MeetingPrescriptions.vue'
import { medicalHistoriesApi } from '@/features/medicalHistories/api'
import type { AnimalMeetingMeta, UpdateAnimalMeeting } from '@armali/schemas'
import RecurringComponent from '../RecurringComponent.vue'

const { meeting } = defineProps<{ meeting: AnimalMeetingMeta }>()
const router = useRouter()
const { user } = useAuthStore()
const { handle } = useFormErrorStore()

const [acts, prescriptions] = await Promise.all([
  medicalHistoriesApi.getByMeeting(meeting.id),
  prescriptionApi.getByMeeting(meeting.id),
])

const localActs = ref(acts)
const localPrescriptions = ref(prescriptions)
const isEditing = ref(false)

const edit = ref<UpdateAnimalMeeting>({
  description: meeting.description ?? '',
  report: meeting.report ?? '',
  petWeight: meeting.petWeight ?? null,
  petSize: meeting.petSize ?? null,
  startTime: new Date(meeting.startTime),
  endTime: new Date(meeting.endTime),
})

const onSave = async () => {
  try {
    await calendarApi.animal.update(meeting.id, { ...edit.value })
    isEditing.value = false
  } catch (err) {
    handle(err)
  }
}

const onDelete = async () => {
  try {
    await ElMessageBox.confirm('Cette action est irréversible.', 'Supprimer le rendez-vous ?', {
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'warning',
    })
    await calendarApi.delete(meeting.id)
    router.back()
  } catch {}
}

const onActSaved = async () => {
  localActs.value = await medicalHistoriesApi.getByMeeting(meeting.id)
}

const onPrescriptionSaved = async () => {
  localPrescriptions.value = await prescriptionApi.getByMeeting(meeting.id)
}
</script>

<template>
  <MeetingHeader
    :meeting="meeting"
    :is-editing="isEditing"
    :user="user"
    @edit="isEditing = true"
    @cancel="isEditing = false"
    @save="onSave"
    @delete="onDelete"
  />

  <div class="meeting-content">
    <div class="meeting-left">
      <MeetingPets :meeting="meeting" />
    </div>

    <div class="meeting-right">
      <MeetingInfo :meeting="meeting" :edit="edit" :is-editing="isEditing" />
      <MeetingActs :acts="localActs" :meeting-id="meeting.id" @saved="onActSaved" />
      <MeetingPrescriptions
        :prescriptions="localPrescriptions"
        :meeting-id="meeting.id"
        @saved="onPrescriptionSaved"
      />
    </div>
    <RecurringComponent v-if="meeting.recurringId" :recurring-id="meeting.recurringId" />
  </div>
</template>

<style lang="scss" scoped>
.meeting-content {
  display: flex;
  gap: var(--spacing-xl);
  flex-direction: column;

  @include above('lg') {
    flex-direction: row;
  }
}

.meeting-right {
  width: 100%;
  display: flex;
  gap: var(--spacing-xl);
  flex-direction: column;
}

.meeting-left {
  display: flex;
  gap: var(--spacing-md);
  width: 100%;

  @include below('sm') {
    flex-direction: column;
  }

  @include above('lg') {
    flex-direction: column;
    width: 300px;
  }
}
</style>
