import { ref } from 'vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { ElMessage } from 'element-plus'
import { useFormErrorStore } from '@/stores/formErrorStore'
import { meetingApi } from '../api/meeting.api'
import type { MeetingId, MeetingRecurringId, UserId, MeetingKind } from '@armali/schemas'
import { timeStringToDate } from '../components/utils'

dayjs.extend(utc)

interface InternalFields {
  title: string
  description: string
  userIds: UserId[]
}

export function useMeetingActions() {
  const { handle } = useFormErrorStore()
  const saving = ref(false)
  const deleting = ref(false)

  // ── Sauvegarde date/heure (+ champs internes optionnels) ────────────────────
  async function saveSchedule({
    meetingId,
    parentId,
    date,
    startTime,
    endTime,
    scope,
    internal,
    onSuccess,
  }: {
    meetingId: MeetingId
    parentId: MeetingRecurringId | null
    date: Date
    startTime: string
    endTime: string
    scope: 'single' | 'all'
    internal?: InternalFields
    onSuccess: (resultId: string) => void
  }) {
    saving.value = true
    try {
      if (scope === 'all' && parentId) {
        const result = await meetingApi.internal.update({
          meetingId,
          scope: 'all',
          date: dayjs(date).toISOString(),
          meeting: {
            startTime: timeStringToDate(startTime),
            endTime: timeStringToDate(endTime),
            ...internal,
          },
        })
        const id = result.meeting?.id ?? result.recurring?.id
        if (!id) throw new Error('Id not found')
        onSuccess(id)
      } else {
        const result = await meetingApi.internal.update({
          meetingId,
          scope: 'single',
          date: dayjs(date).toISOString(),
          meeting: {
            startTime: timeStringToDate(startTime),
            endTime: timeStringToDate(endTime),
            ...internal,
          },
        })

        const id = result.meeting?.id ?? result.recurring?.id
        if (!id) throw new Error('Id not found')
        onSuccess(id)
      }
    } catch (err) {
      handle(err)
      throw err
    } finally {
      saving.value = false
    }
  }

  // ── Suppression, réutilisable EventPopup + pages détail ─────────────────────
  // INTERNAL : gère le scope single/all (exception vs suppression totale)
  // ANIMAL : suppression simple, pas de notion de récurrence pour l'instant
  async function deleteMeeting({
    kind,
    meetingId,
    date,
    scope = 'single',
    onSuccess,
  }: {
    kind: MeetingKind
    meetingId: MeetingId
    date: Date
    scope?: 'single' | 'all'
    onSuccess: () => void
  }) {
    deleting.value = true
    try {
      if (kind === 'INTERNAL') {
        await meetingApi.internal.delete({
          meetingId,
          date: date.toISOString(),
          scope,
        })
      } else if (kind === 'ANIMAL') {
        await meetingApi.animal.delete({ meetingId })
      }
      ElMessage.success('Rendez-vous supprimé')
      onSuccess()
    } catch {
      ElMessage.error('Erreur lors de la suppression')
    } finally {
      deleting.value = false
    }
  }

  return { saveSchedule, deleteMeeting, saving, deleting, timeStringToDate }
}
