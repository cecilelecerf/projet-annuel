<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useFormErrorStore } from '@/stores/formErrorStore'
import { meetingApi } from '../../api/meeting.api.ts'
import { prescriptionApi } from '@/features/prescriptions/api'
import MeetingPets from './MeetingPets.vue'
import MeetingInfo from './MeetingInfo.vue'
import MeetingActs from './MeetingActs.vue'
import MeetingPrescriptions from './MeetingPrescriptions.vue'
import { medicalHistoriesApi } from '@/features/medicalHistories/api'
import type { AnimalMeetingMeta, UpdateAnimalMeeting } from '@armali/schemas'
import { useMeetingActions } from '../../composables/useMeetingActions.ts'
import { combineDateAndTime } from '../utils.ts'
import HeaderMeetingSection from '../HeaderMeetingSection.vue'

const { meeting } = defineProps<{ meeting: AnimalMeetingMeta }>()
const router = useRouter()
const { user } = useAuthStore()
const { handle } = useFormErrorStore()
const { deleteMeeting, deleting } = useMeetingActions()

const showDeleteDialog = ref(false)

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

const isUpcoming = computed(() => {
  if (!meeting.date || !meeting.startTime) return false
  return combineDateAndTime(meeting.date, meeting.startTime) > new Date()
})

const onSave = async () => {
  try {
    await meetingApi.animal.update(meeting.id, { ...edit.value })
    isEditing.value = false
  } catch (err) {
    console.log(err)
    handle(err)
  }
}

const onDelete = async () => {
  await deleteMeeting({
    kind: 'ANIMAL',
    meetingId: meeting.id,
    date: meeting.date,
    onSuccess: () => {
      showDeleteDialog.value = false
      router.back()
    },
  })
}

const onActSaved = async () => {
  localActs.value = await medicalHistoriesApi.getByMeeting(meeting.id)
}

const onPrescriptionSaved = async () => {
  localPrescriptions.value = await prescriptionApi.getByMeeting(meeting.id)
}
</script>

<template>
  <HeaderMeetingSection
    v-if="user"
    :editing="isEditing"
    :is-recurring-occurrence="!!meeting.parentId && String(meeting.parentId) === String(meeting.id)"
    :is-upcoming="isUpcoming"
    @back="router.back()"
    @edit="isEditing = true"
    @save="onSave"
    @cancel="isEditing = false"
    @delete="showDeleteDialog = true"
    :user="user"
  />

  <div class="meeting-content">
    <div class="meeting-left">
      <MeetingPets :meeting="meeting" />
    </div>

    <div class="meeting-right">
      <MeetingInfo
        :meeting="meeting"
        :edit="edit"
        :is-editing="isEditing"
        :is-staff="user?.role === 'SECRETARY' || user?.role === 'VETERINARIAN'"
      />
      <MeetingActs
        :acts="localActs"
        :clinic-id="meeting.veterinarianClinic?.clinicId"
        :meeting-id="meeting.id"
        @saved="onActSaved"
      />
      <MeetingPrescriptions
        :prescriptions="localPrescriptions"
        :meeting-id="meeting.id"
        @saved="onPrescriptionSaved"
      />
    </div>
  </div>
  <ConfirmDeleteDialog
    v-model="showDeleteDialog"
    title="Supprimer le rendez-vous ?"
    message="Cette action est définitive et ne peut pas être annulée."
    :loading="deleting"
    @confirm="onDelete"
  />
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
