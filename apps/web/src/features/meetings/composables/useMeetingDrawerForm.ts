// src/features/meetings/composables/useMeetingDrawerForm.ts
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import type { MeetingKind, Animal, User, UserId, ClinicId, Clinic } from '@armali/schemas'
import { useAuthStore } from '@/stores/authStore'
import { usersApi } from '@/features/users/api/user.api'
import { animalApi } from '@/features/animals/api'
import { useFormErrorStore } from '@/stores/formErrorStore'
import { toUserId } from '@/features/users/utils'
import { clinicApi } from '@/features/clinics/api.ts'
import { meetingApi } from '../api/meeting.api'

export function useMeetingDrawerForm(initialDate: Date | null, emit: (event: 'close') => void) {
  const route = useRoute()
  const id = route.params.id as string
  const formErrorStore = useFormErrorStore()
  const { user } = useAuthStore()
  const role = user?.role

  const veterinarianPromise = () => {
    if (id) return usersApi.get(id)
    if (role === 'VETERINARIAN' && user) return usersApi.get(user.id)
    return Promise.resolve(null)
  }
  let veterinarian: User | null = null

  const canCreateAnimal = computed(() => role === 'VETERINARIAN' || role === 'SECRETARY')

  const date = ref<Date>(initialDate ?? new Date())
  const start = ref(initialDate ? dayjs(initialDate).format('HH:mm:ss') : '')
  const end = ref(initialDate ? dayjs(initialDate).add(1, 'hour').format('HH:mm:ss') : '')
  const isTimeValid = ref(false)

  const type = ref<Extract<MeetingKind, 'INTERNAL' | 'ANIMAL'>>('INTERNAL')
  const title = ref('')
  const location = ref('')
  const clinicId = ref<ClinicId | undefined>(
    user?.role === 'VETERINARIAN' ? undefined : user?.clinicId,
  )
  const myClinics = ref<Clinic[]>([])
  const participants = ref<User[]>([])
  const selectedClient = ref<User | null>(null)
  const selectedVet = ref<User | null>(null)
  const selectAnimal = ref<Animal | null>(null)

  const clients = ref<User[]>([])
  const vets = ref<User[]>([])
  const staffs = ref<User[]>([])
  const animals = ref<Animal[]>([])

  const isVetLocked = ref(false)
  const showClinicSelect = computed(() => role === 'VETERINARIAN' && myClinics.value.length > 0)

  // Résout le véto pré-sélectionné via la route (:id), une fois au démarrage
  async function init() {
    veterinarian = await veterinarianPromise()
    selectedVet.value = veterinarian
    isVetLocked.value = !!veterinarian
  }

  watch(selectedClient, async (client) => {
    selectAnimal.value = null
    animals.value = client ? await animalApi.getAllByUser(client.id) : []
  })

  watch(
    type,
    async (t) => {
      if (t === 'ANIMAL') {
        const promises: Promise<unknown>[] = [
          usersApi.getUsersByRole(['CLIENT']),
          usersApi.getUsersByRole(['VETERINARIAN']),
        ]
        if (role === 'VETERINARIAN' && myClinics.value.length === 0) {
          promises.push(clinicApi.getMine())
        }

        const [clientsData, vetsData, clinicsData] = await Promise.all(promises)
        clients.value = clientsData as User[]
        vets.value = vetsData as User[]

        if (clinicsData) {
          myClinics.value = clinicsData as Clinic[]
          if (myClinics.value.length === 1 && !clinicId.value) {
            clinicId.value = myClinics.value[0]?.id
          }
        }
      } else {
        staffs.value = await usersApi.getUsersByRole(['STAFF'])
      }
    },
    { immediate: true },
  )

  async function handleSubmit() {
    formErrorStore.clear()
    try {
      if (type.value === 'INTERNAL') {
        if (!user?.clinicId) return
        const participantIds: UserId[] = [
          ...participants.value.map(({ id }) => toUserId(id)),
          veterinarian ? toUserId(veterinarian.id) : toUserId(user.id),
        ]
        await meetingApi.internal.new({
          title: title.value,
          userIds: participantIds,
          date: date.value,
          startTime: new Date(`1970-01-01T${start.value}`),
          endTime: new Date(`1970-01-01T${end.value}`),
          clinicId: user?.clinicId,
        })
      } else {
        if (!selectedVet.value || !selectedClient.value || !selectAnimal.value || !clinicId.value)
          return
        await meetingApi.animal.new({
          date: date.value,
          startTime: new Date(`1970-01-01T${start.value}`),
          endTime: new Date(`1970-01-01T${end.value}`),
          veterinarianId: selectedVet.value.id,
          animalId: selectAnimal.value?.id,
          clinicId: clinicId.value,
        })
      }
      emit('close')
    } catch (err) {
      formErrorStore.handle(err)
    }
  }
  const isFormValid = computed(() => {
    if (type.value === 'INTERNAL') {
      return !!title.value && participants.value.length > 0
    }
    // ANIMAL
    return !!(
      selectedVet.value &&
      selectedClient.value &&
      selectAnimal.value &&
      clinicId.value &&
      isTimeValid.value
    )
  })
  return {
    role,
    canCreateAnimal,
    date,
    start,
    end,
    type,
    title,
    location,
    clinicId,
    myClinics,
    showClinicSelect,
    participants,
    selectedClient,
    selectedVet,
    selectAnimal,
    clients,
    vets,
    staffs,
    animals,
    isVetLocked,
    init,
    handleSubmit,
    isFormValid,
    isTimeValid,
  }
}
