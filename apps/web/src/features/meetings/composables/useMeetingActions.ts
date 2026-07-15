import { ref } from 'vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { ElMessage } from 'element-plus'
import { useFormErrorStore } from '@/stores/formErrorStore'
import { meetingApi } from '../api/meeting.api'
import type { MeetingId, MeetingRecurringId, UserId, MeetingKind } from '@armali/schemas'
import { timeStringToDate } from '../components/utils'
import { trackEvent } from '@/lib/matomo'

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
    originDate,
    startTime,
    endTime,
    scope,
    internal,
    onSuccess,
    targetDate,
  }: {
    meetingId: MeetingId
    parentId: MeetingRecurringId | null
    originDate: Date
    startTime: string
    endTime: string
    scope: 'single' | 'all'
    internal?: InternalFields
    onSuccess: (resultId: string) => void
    targetDate: Date
  }) {
    saving.value = true
    try {
      if (scope === 'all' && parentId) {
        const result = await meetingApi.internal.update({
          ...internal,
          meetingId,
          scope: 'all',
          date: dayjs(originDate).toISOString(),
          meeting: {
            date: targetDate,
            startTime: timeStringToDate(startTime),
            endTime: timeStringToDate(endTime),
          },
        })
        const id = result.meeting?.id ?? result.recurring?.id
        if (!id) throw new Error('Id not found')
        onSuccess(id)
      } else {
        const result = await meetingApi.internal.update({
          meetingId,
          scope: 'single',
          date: dayjs(originDate).toISOString(),
          meeting: {
            ...internal,

            startTime: timeStringToDate(startTime),
            endTime: timeStringToDate(endTime),
            date: targetDate,
          },
        })

        const id = result.meeting?.id ?? result.recurring?.id
        if (!id) throw new Error('Id not found')
        onSuccess(id)
      }
      trackEvent('meeting', 'reschedule_success', scope)
    } catch (err) {
      trackEvent('meeting', 'reschedule_failure', scope)
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
      trackEvent('meeting', 'cancel_success', kind)
      ElMessage.success('Rendez-vous supprimé')
      onSuccess()
    } catch {
      trackEvent('meeting', 'cancel_failure', kind)
      ElMessage.error('Erreur lors de la suppression')
    } finally {
      deleting.value = false
    }
  }

  return { saveSchedule, deleteMeeting, saving, deleting, timeStringToDate }
}
