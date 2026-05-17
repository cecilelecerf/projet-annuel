<script setup lang="ts">
import type {
  ClientId,
  MeetingKind,
  OwnedPetId,
  User,
  UserId,
  VeterinarianId,
} from '@armali/schemas'
import { computed, ref } from 'vue'
import { calendarApi } from '../api/calendar.api'
import { useAuthStore } from '@/stores/authStore'
import { userApi } from '@/features/users/api/user.api'
import dayjs from 'dayjs'
import { useRoute } from 'vue-router'
import { toUserId } from '@/features/users/utils'

const route = useRoute()
const id = route.params.id as string
const veterinarian: User | null = id ? await userApi.getUser(id) : null
const authStore = useAuthStore()
const { initialDate } = defineProps<{
  initialDate: Date | null
}>()
const emit = defineEmits<{ close: [] }>()

const date = ref<Date>(initialDate ?? new Date())
const start = ref(initialDate ? dayjs(initialDate).format('HH:mm:ss') : '')
const end = ref(initialDate ? dayjs(initialDate).add(1, 'hour').format('HH:mm:ss') : '')

const type = ref<Extract<MeetingKind, 'INTERNAL' | 'ANIMAL'>>('INTERNAL')
const title = ref('')

const location = ref('')
const participantSearch = ref('')
const participants = ref<{ id: string; name: string; avatar?: string }[]>([])
const animalName = ref('')
const clientSearch = ref('')
const selectedClient = ref<{ userId: ClientId; name: string; petId: OwnedPetId } | null>(null)
const vetSearch = ref('')
const selectedVet = ref<{ id: VeterinarianId; name: string } | null>(null)

const clients = await userApi.getUsersByRole('CLIENT')
const vets = await userApi.getUsersByRole('VETERINARIAN')

const filteredClients = computed(() =>
  clientSearch.value.length > 1
    ? clients.filter((u) => u.lastname.toLowerCase().includes(clientSearch.value.toLowerCase()))
    : [],
)

const filteredVets = computed(() =>
  vetSearch.value.length > 1
    ? vets.filter((u) => u.lastname.toLowerCase().includes(vetSearch.value.toLowerCase()))
    : [],
)

const addParticipant = (user: User) => {
  participants.value.push({ id: user.id, name: user.lastname })
  participantSearch.value = ''
}

const removeParticipant = (id: string) => {
  participants.value = participants.value.filter((p) => p.id !== id)
}

const handleSubmit = async () => {
  console.log(authStore.user?.clinicId)
  if (type.value === 'INTERNAL') {
    if (!authStore.user?.clinicId) return
    const participantIds: UserId[] = [
      ...participants.value.map(({ id }) => toUserId(id)),
      veterinarian ? toUserId(veterinarian.id) : toUserId(authStore.user.id),
    ]
    await calendarApi.internal.new({
      title: title.value,
      type: 'SPECIFIED',
      participantIds,
      specificDate: date.value,
      startTime: new Date(`1970-01-01T${start.value}`),
      endTime: new Date(`1970-01-01T${end.value}`),
      kind: 'INTERNAL',
      clinicId: authStore.user?.clinicId,
    })
  } else {
    if (!selectedVet.value || !selectedClient.value) return
    await calendarApi.animal.new({
      kind: 'ANIMAL',
      type: 'SPECIFIED',
      specificDate: date.value,
      startTime: new Date(`1970-01-01T${start.value}`),
      endTime: new Date(`1970-01-01T${end.value}`),
      veterinarianId: selectedVet.value.id,
      ownedPetId: selectedClient.value.petId,
    })
  }
  emit('close')
}
</script>

<template>
  <div class="drawer">
    <!-- Header -->
    <div class="drawer-header">
      <div class="header-left">
        <div class="type-dot" :class="type === 'INTERNAL' ? 'dot-internal' : 'dot-animal'" />
        <h3>Nouvel événement</h3>
      </div>
      <el-icon class="close-btn" @click="$emit('close')">
        <CloseBold />
      </el-icon>
    </div>

    <!-- Type selector -->
    <div class="type-selector">
      <button
        class="type-btn"
        :class="{ active: type === 'INTERNAL', 'type-internal': type === 'INTERNAL' }"
        @click="type = 'INTERNAL'"
      >
        <el-icon><ChatDotRound /></el-icon>
        Réunion
      </button>
      <button
        class="type-btn"
        :class="{ active: type === 'ANIMAL', 'type-animal': type === 'ANIMAL' }"
        @click="type = 'ANIMAL'"
      >
        <el-icon><FirstAidKit /></el-icon>
        Rendez-vous
      </button>
    </div>

    <!-- Form -->
    <div class="form">
      <!-- ANIMAL : animal + client -->
      <template v-if="type === 'ANIMAL'">
        <div class="field">
          <label class="field-label">Animal</label>
          <el-input v-model="animalName" placeholder="Nom de l'animal" size="large">
            <template #prefix
              ><el-icon><Pets /></el-icon
            ></template>
          </el-input>
        </div>
        <div class="field">
          <label class="field-label">Client</label>
          <el-autocomplete
            v-model="clientSearch"
            :fetch-suggestions="
              (q: string, cb: any) => cb(filteredClients.map((u) => ({ value: u.lastname, ...u })))
            "
            placeholder="Rechercher un client..."
            size="large"
            style="width: 100%"
            @select="(u: any) => (selectedClient = u)"
          >
            <template #default="{ item }">
              <div class="autocomplete-item">
                <el-avatar :size="20" class="chip-avatar">{{ item.name.charAt(0) }}</el-avatar>
                <span>{{ item.name }}</span>
              </div>
            </template>
          </el-autocomplete>
          <div
            v-if="selectedClient"
            class="participant-chip"
            style="margin-top: var(--spacing-xs); align-self: flex-start"
          >
            <el-avatar :size="24" class="chip-avatar">{{
              selectedClient.name.charAt(0)
            }}</el-avatar>
            <span class="chip-name">{{ selectedClient.name }}</span>
            <el-icon class="chip-remove" @click="selectedClient = null"><Close /></el-icon>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Vétérinaire</label>
          <el-autocomplete
            v-model="vetSearch"
            :fetch-suggestions="
              (q: string, cb: any) => cb(filteredVets.map((u) => ({ value: u.lastname, ...u })))
            "
            placeholder="Rechercher un vétérinaire..."
            size="large"
            style="width: 100%"
            @select="(u: any) => (selectedVet = u)"
          >
            <template #default="{ item }">
              <div class="autocomplete-item">
                <el-avatar :size="20" class="chip-avatar">{{ item.name.charAt(0) }}</el-avatar>
                <span>{{ item.name }}</span>
              </div>
            </template>
          </el-autocomplete>
          <div
            v-if="selectedVet"
            class="participant-chip"
            style="margin-top: var(--spacing-xs); align-self: flex-start"
          >
            <el-avatar :size="24" class="chip-avatar">{{ selectedVet.name.charAt(0) }}</el-avatar>
            <span class="chip-name">{{ selectedVet.name }}</span>
            <el-icon class="chip-remove" @click="selectedVet = null"><Close /></el-icon>
          </div>
        </div>
      </template>

      <!-- INTERNAL : titre + participants + lieu -->
      <template v-if="type === 'INTERNAL'">
        <div class="field">
          <label class="field-label">Titre</label>
          <el-input v-model="title" placeholder="Nom de la réunion" size="large" />
        </div>
        <div class="field">
          <label class="field-label">Participants</label>
          <el-autocomplete
            v-model="participantSearch"
            :fetch-suggestions="
              (q: string, cb: any) =>
                cb(
                  vets
                    .filter((u) => u.lastname.toLowerCase().includes(q.toLowerCase()))
                    .map((u) => ({ value: `${u.firstname} ${u.lastname}`, ...u })),
                )
            "
            placeholder="Rechercher un participant..."
            size="large"
            style="width: 100%"
            @select="(u: any) => addParticipant(u)"
          />
          <div v-if="participants.length > 0" class="participants-list">
            <div v-for="p in participants" :key="p.id" class="participant-chip">
              <el-avatar :size="24" class="chip-avatar">{{ p.name.charAt(0) }}</el-avatar>
              <span class="chip-name">{{ p.name }}</span>
              <el-icon class="chip-remove" @click="removeParticipant(p.id)"><Close /></el-icon>
            </div>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Lieu</label>
          <el-input v-model="location" placeholder="Salle, adresse..." size="large">
            <template #prefix
              ><el-icon><Location /></el-icon
            ></template>
          </el-input>
        </div>
      </template>

      <!-- Commun : date + horaires -->
      <div class="field">
        <label class="field-label">Date</label>
        <el-calendar v-model="date" class="compact-calendar" />
      </div>

      <div class="field">
        <label class="field-label">Horaires</label>
        <div class="time-row">
          <div class="time-slot">
            <span class="time-label">De</span>
            <el-time-picker
              v-model="start"
              placeholder="09:00"
              format="HH:mm"
              value-format="HH:mm:ss"
              size="large"
              style="width: 100%"
            />
          </div>
          <div class="time-divider">→</div>
          <div class="time-slot">
            <span class="time-label">À</span>
            <el-time-picker
              v-model="end"
              placeholder="10:00"
              format="HH:mm"
              value-format="HH:mm:ss"
              size="large"
              style="width: 100%"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="drawer-footer">
      <el-button size="large" @click="$emit('close')">Annuler</el-button>
      <el-button type="primary" size="large" @click="handleSubmit"> Créer l'événement </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color);
}

// ── Header ────────────────────────────────────────────────────────────────────

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  h3 {
    margin: 0;
    font-size: 18px;
    color: var(--el-text-color-primary);
  }
}

.type-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  transition: background-color 0.2s;

  &.dot-internal {
    background-color: var(--el-color-purple);
  }
  &.dot-animal {
    background-color: var(--el-color-teal);
  }
}

.close-btn {
  cursor: pointer;
  font-size: 18px;
  color: var(--el-text-color-secondary);
  transition: color 0.2s;

  &:hover {
    color: var(--el-text-color-primary);
  }
}

// ── Type selector ─────────────────────────────────────────────────────────────

.type-selector {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.type-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1.5px solid var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-secondary);
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover.type-internal {
    border-color: var(--el-color-purple-dark);
    color: var(--el-color-purple-dark);
  }
  &:hover.type-animal {
    border-color: var(--el-color-teal-dark);
    color: var(--el-color-teal-dark);
  }

  &.active.type-internal {
    background: var(--el-color-purple-light);
    border-color: var(--el-color-purple);
    color: var(--el-color-purple-dark);
    font-weight: var(--fw-semibold);
  }

  &.active.type-animal {
    background: var(--el-color-teal-light);
    border-color: var(--el-color-teal);
    color: var(--el-color-teal-dark);
    font-weight: var(--fw-semibold);
  }
}

// ── Form ──────────────────────────────────────────────────────────────────────

.form {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.field-label {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

// ── Horaires ──────────────────────────────────────────────────────────────────
:deep(.compact-calendar) {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-md);
  overflow: hidden;

  .el-calendar__header {
    padding: var(--spacing-sm) var(--spacing-md);
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-sm);

    .el-calendar__title {
      font-family: 'Nunito', sans-serif;
      font-weight: var(--fw-bold);
      font-size: 15px;
    }

    .el-button-group {
      .el-button {
        padding: 4px 10px;
        font-size: 12px;
      }
    }
  }

  .el-calendar__body {
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .el-calendar-table {
    th {
      font-size: 11px;
      font-weight: var(--fw-semibold);
      color: var(--el-text-color-placeholder);
      text-transform: uppercase;
      padding: var(--spacing-xs) 0;
    }

    td {
      border: none;
    }

    .el-calendar-day {
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      font-size: 13px;
      padding: 0;
      transition: background 0.15s;

      &:hover {
        background: var(--el-fill-color);
      }
    }

    td.is-selected .el-calendar-day {
      background: var(--el-color-primary);
      color: white;
      font-weight: var(--fw-semibold);
    }

    td.is-today .el-calendar-day {
      color: var(--el-color-primary);
      font-weight: var(--fw-bold);
    }

    td.is-today.is-selected .el-calendar-day {
      color: white;
    }
  }
}
.time-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.time-slot {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.time-label {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.time-divider {
  color: var(--el-text-color-placeholder);
  padding-top: 20px;
  font-size: 16px;
}

// ── Participants ──────────────────────────────────────────────────────────────

.participants-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
}

.participant-chip {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 4px var(--spacing-sm) 4px 4px;
  background: var(--el-fill-color-light);
  border-radius: var(--radius-full);
  border: 1px solid var(--el-border-color-lighter);

  .chip-avatar {
    background: var(--el-color-primary);
    color: white;
    font-size: 11px;
    font-weight: var(--fw-bold);
  }

  .chip-name {
    font-size: 13px;
    color: var(--el-text-color-primary);
  }

  .chip-remove {
    cursor: pointer;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    transition: color 0.2s;

    &:hover {
      color: var(--el-color-danger);
    }
  }
}
.autocomplete-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 13px;
}

// ── Footer ────────────────────────────────────────────────────────────────────

.drawer-footer {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--el-border-color-lighter);

  .el-button {
    flex: 1;
  }
}
</style>
