import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { useFormErrorStore } from '@/stores/formErrorStore'
import { availabilitiesApi } from '../api'
import type {
  AvailabilityRecurringResponse,
  AvailabilityPunctualResponse,
  AvailabilityResponse,
  AvailabilityId,
  MeetingRecurringId,
} from '@armali/schemas'
import { defaultForm, toTimeDate, validateForm, type AvailabilityForm } from '../types/availabilty'

export function useAvailabilities() {
  const formError = useFormErrorStore()

  const availabilities = ref<AvailabilityResponse[]>([])
  const loading = ref(true)
  const showDialog = ref(false)
  const editingId = ref<AvailabilityId | null>(null)
  const editingRecurringId = ref<MeetingRecurringId | null>(null)
  const saving = ref(false)
  const deleting = ref<AvailabilityId | null>(null)

  const form = ref<AvailabilityForm>(defaultForm())

  // ── Computed ──────────────────────────────────────────────────────────────────
  const recurring = computed(() =>
    availabilities.value.filter((a): a is AvailabilityRecurringResponse => 'recurring' in a),
  )

  const punctual = computed(() =>
    availabilities.value
      .filter((a): a is AvailabilityPunctualResponse => 'meeting' in a)
      .sort((a, b) => new Date(a.meeting.date).getTime() - new Date(b.meeting.date).getTime()),
  )

  const dialogTitle = computed(() => {
    if (editingId.value) return 'Modifier la disponibilité'
    return form.value.kind === 'RECURRING'
      ? 'Ajouter une récurrence'
      : 'Ajouter une date ponctuelle'
  })

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  async function fetchAvailabilities() {
    loading.value = true
    try {
      availabilities.value = await availabilitiesApi.getAll({
        date: dayjs().format('YYYY-MM-DD'),
      })
    } catch (err) {
      formError.handle(err)
    } finally {
      loading.value = false
    }
  }

  // ── Dialog ────────────────────────────────────────────────────────────────────
  function openCreate(kind: 'RECURRING' | 'PUNCTUAL') {
    editingId.value = null
    editingRecurringId.value = null
    form.value = { ...defaultForm(), kind }
    showDialog.value = true
  }

  function openEdit(avail: AvailabilityResponse) {
    editingId.value = avail.id

    if ('recurring' in avail) {
      editingRecurringId.value = avail.recurringId
      const rec = avail.recurring
      form.value = {
        kind: 'RECURRING',
        dayOfWeek: [...rec.dayOfWeek],
        startTime: dayjs(rec.startTime).format('HH:mm'),
        endTime: dayjs(rec.endTime).format('HH:mm'),
        dateStart: dayjs(rec.dateStart).format('YYYY-MM-DD'),
        dateEnd: dayjs(rec.dateEnd).format('YYYY-MM-DD'),
        date: '',
        frequency: rec.frequency,
      }
    } else {
      editingRecurringId.value = null
      const mtg = avail.meeting
      form.value = {
        kind: 'PUNCTUAL',
        dayOfWeek: [],
        startTime: dayjs(mtg.startTime).format('HH:mm'),
        endTime: dayjs(mtg.endTime).format('HH:mm'),
        date: dayjs(mtg.date).format('YYYY-MM-DD'),
        dateStart: '',
        dateEnd: '',
        frequency: 'WEEKLY',
      }
    }

    showDialog.value = true
  }

  // ── Save ──────────────────────────────────────────────────────────────────────
  async function save() {
    formError.clear()
    const error = validateForm(form.value)
    if (error) {
      ElMessage.error(error)
      return
    }

    saving.value = true
    try {
      if (editingId.value) {
        await _update()
        ElMessage.success('Disponibilité mise à jour')
      } else {
        console.log('fom')
        console.log(form.value)

        await _create()
        ElMessage.success('Disponibilité ajoutée')
      }

      showDialog.value = false
      editingRecurringId.value = null
      await fetchAvailabilities()
    } catch (err) {
      formError.handle(err)
    } finally {
      saving.value = false
    }
  }

  async function _create() {
    if (form.value.kind === 'RECURRING') {
      console.log(form.value)
      await availabilitiesApi.create({
        payload: {
          type: 'RECURRING' as const,
          kind: 'AVAILABILITY' as const,
          dayOfWeek: form.value.dayOfWeek,
          startTime: toTimeDate(form.value.startTime),
          endTime: toTimeDate(form.value.endTime),
          dateStart: dayjs(form.value.dateStart).toDate(),
          dateEnd: dayjs(form.value.dateEnd).toDate(),
          frequency: form.value.frequency,
        },
      })
    } else {
      await availabilitiesApi.create({
        payload: {
          type: 'SPECIFIED' as const,
          kind: 'AVAILABILITY' as const,
          date: dayjs(form.value.date).toDate(),
          startTime: toTimeDate(form.value.startTime),
          endTime: toTimeDate(form.value.endTime),
        },
      })
    }
  }

  async function _update() {
    const dateStart = dayjs(form.value.dateStart)
    const dateToStartAction = dateStart.isAfter(dayjs(), 'day')
      ? dateStart.toDate()
      : dayjs().toDate()
    if (form.value.kind === 'RECURRING' && editingRecurringId.value !== null) {
      await availabilitiesApi.update({
        id: editingId.value!,
        payload: {
          dateToStartAction: dateToStartAction,
          type: 'RECURRING',
          recurringId: editingRecurringId.value,
          dayOfWeek: form.value.dayOfWeek,
          startTime: toTimeDate(form.value.startTime),
          endTime: toTimeDate(form.value.endTime),
          dateStart: dateToStartAction,
          dateEnd: dayjs(form.value.dateEnd).toDate(),
          frequency: form.value.frequency,
        },
      })
    } else {
      await availabilitiesApi.update({
        id: editingId.value!,
        payload: {
          type: 'PUNCTUAL',
          date: dayjs(form.value.date).toDate() || undefined,
          startTime: toTimeDate(form.value.startTime) || undefined,
          endTime: toTimeDate(form.value.endTime) || undefined,
        },
      })
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  async function remove(id: AvailabilityId) {
    try {
      await ElMessageBox.confirm(
        'Cette disponibilité sera supprimée définitivement. Toutes les réunions planifiées durant cette période seront annulées.',
        'Confirmer la suppression',
        {
          confirmButtonText: 'Supprimer',
          cancelButtonText: 'Annuler',
          confirmButtonClass: 'el-button--danger',
        },
      )

      deleting.value = id
      await availabilitiesApi.delete({ id })
      await fetchAvailabilities()
      ElMessage.success('Disponibilité supprimée')
    } catch {
    } finally {
      deleting.value = null
    }
  }

  return {
    // state
    availabilities,
    loading,
    showDialog,
    editingId,
    saving,
    deleting,
    form,
    // computed
    recurring,
    punctual,
    dialogTitle,
    // actions
    fetchAvailabilities,
    openCreate,
    openEdit,
    save,
    remove,
  }
}
