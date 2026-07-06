import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import {
  type MeetingKind,
  type Animal,
  type User,
  type UserId,
  type ClinicId,
  type Clinic,
  type BaseUser,
  baseUserSchema,
  type StaffMember,
} from '@armali/schemas'
import { useAuthStore } from '@/stores/authStore'
import { animalApi } from '@/features/animals/api'
import { useFormErrorStore } from '@/stores/formErrorStore'
import { toUserId } from '@/features/users/utils'
import { clinicApi } from '@/features/clinics/clinic.api'
import { meetingApi } from '../api/meeting.api'
import { usersApi } from '@/features/users/api/user.api'
import { http } from '@/lib/api'
import { staffApi } from '@/features/staffs/staff.api'

export function useMeetingDrawerForm(initialDate: Date | null, emit: (event: 'close') => void) {
  const route = useRoute()
  const id = route.params.id as string
  const formErrorStore = useFormErrorStore()
  const { user } = useAuthStore()
  const role = user?.role

  const veterinarianPromise = () => {
    if (id) return usersApi.get(id)
    if (role === 'VETERINARIAN')
      return http.get('/auth/me').then((data) => baseUserSchema.parse(data))
    return Promise.resolve(null)
  }
  let veterinarian: BaseUser | null = null

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
  const selectedVet = ref<BaseUser | null>(null)
  const selectAnimal = ref<Animal | null>(null)

  const clients = ref<User[]>([])
  const vets = ref<StaffMember[]>([])
  const staffs = ref<StaffMember[]>()
  const animals = ref<Animal[]>([])

  const isVetLocked = ref(false)
  const showClinicSelect = computed(() => role === 'VETERINARIAN' && myClinics.value.length > 0)

  // Charge les cliniques du véto indépendamment du reste — nécessaire pour peupler
  // le select clinique avant même qu'un clinicId ne soit choisi (cas multi-cliniques)
  async function loadMyClinics() {
    if (role !== 'VETERINARIAN') return
    myClinics.value = await clinicApi.getMine()
    if (myClinics.value.length === 1 && !clinicId.value) {
      clinicId.value = myClinics.value[0]?.id
    }
  }

  // Résout le véto pré-sélectionné via la route (:id), une fois au démarrage
  async function init() {
    veterinarian = await veterinarianPromise()
    selectedVet.value = veterinarian
    isVetLocked.value = !!veterinarian
    await loadMyClinics()
  }

  watch(selectedClient, async (client) => {
    selectAnimal.value = null
    animals.value = client ? await animalApi.getAllByUser(client.id) : []
  })

  // Se redéclenche sur changement de type OU de clinique — nécessaire pour un véto
  // multi-cliniques qui choisit sa clinique après le montage initial du drawer
  watch(
    [type, clinicId],
    async ([t, cid]) => {
      if (!cid) {
        // Pas encore de clinique connue : on vide plutôt que de fetcher à vide
        clients.value = []
        vets.value = []
        staffs.value = undefined
        return
      }

      if (t === 'ANIMAL') {
        const [clientsData, vetsData] = await Promise.all([
          usersApi.getUsersByRole({ roles: ['CLIENT'] }),
          staffApi.getAllByClinic({ clinicId: cid, roles: ['VETERINARIAN'] }),
        ])
        clients.value = clientsData as User[]
        vets.value = vetsData as StaffMember[]
      } else {
        staffs.value = await staffApi.getAllByClinic({ clinicId: cid })
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
