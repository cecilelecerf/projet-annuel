<script setup lang="ts">
import type { MeetingKind, Animal, User, UserId } from '@armali/schemas'
import { computed, ref, watch } from 'vue'
import { calendarApi } from '../../api/calendar.api.ts'
import { useAuthStore } from '@/stores/authStore'
import { usersApi } from '@/features/users/api/user.api'
import dayjs from 'dayjs'
import { useRoute } from 'vue-router'
import { toUserId } from '@/features/users/utils'
import SearchSelectSingle from './SearchSelectSingle.vue'
import SearchSelectMultiple from './SearchSelectMultiple.vue'
import { animalApi } from '@/features/animals/api'
import { useFormErrorStore } from '@/stores/formErrorStore'
import { ChatDotRound, FirstAidKit } from '@element-plus/icons-vue'
import { MEETING_COLORS } from '@/utils/meetingColor.ts'

const route = useRoute()
const id = route.params.id as string
const veterinarian: User | null = id ? await usersApi.get(id) : null
const authStore = useAuthStore()
const { initialDate } = defineProps<{
  initialDate: Date | null
}>()
const emit = defineEmits<{ close: [] }>()
const formErrorStore = useFormErrorStore()

const role = authStore.user?.role

// ── Directeur et référant ne peuvent créer que des réunions internes ──────────
const canCreateAnimal = computed(() => role === 'VETERINARIAN' || role === 'SECRETARY')

const date = ref<Date>(initialDate ?? new Date())
const start = ref(initialDate ? dayjs(initialDate).format('HH:mm:ss') : '')
const end = ref(initialDate ? dayjs(initialDate).add(1, 'hour').format('HH:mm:ss') : '')

const type = ref<Extract<MeetingKind, 'INTERNAL' | 'ANIMAL'>>('INTERNAL')
const title = ref('')
const location = ref('')
const participants = ref<User[]>([])
const selectedClient = ref<User | null>(null)
const selectedVet = ref<User | null>(veterinarian ?? null)
const selectAnimal = ref<Animal | null>(null)

const clients = ref<User[]>([])
const vets = ref<User[]>([])
const staffs = ref<User[]>([])
const animals = ref<Animal[]>([])

watch(selectedClient, async (client) => {
  selectAnimal.value = null
  animals.value = client ? await animalApi.getAllByUser(client.id) : []
})

watch(
  type,
  async (t) => {
    if (t === 'ANIMAL') {
      const [clientsData, vetsData] = await Promise.all([
        usersApi.getUsersByRole(['CLIENT']),
        usersApi.getUsersByRole(['VETERINARIAN']),
      ])
      clients.value = clientsData
      vets.value = vetsData
    } else {
      staffs.value = await usersApi.getUsersByRole(['STAFF'])
    }
  },
  { immediate: true },
)

const isVetLocked = computed(() => !!veterinarian)

const handleSubmit = async () => {
  formErrorStore.clear()
  try {
    if (type.value === 'INTERNAL') {
      if (!authStore.user?.clinicId) return
      const participantIds: UserId[] = [
        ...participants.value.map(({ id }) => toUserId(id)),
        veterinarian ? toUserId(veterinarian.id) : toUserId(authStore.user.id),
      ]
      await calendarApi.internal.new({
        title: title.value,
        userIds: participantIds,
        date: date.value,
        startTime: new Date(`1970-01-01T${start.value}`),
        endTime: new Date(`1970-01-01T${end.value}`),
        clinicId: authStore.user?.clinicId,
      })
    } else {
      if (!selectedVet.value || !selectedClient.value || !selectAnimal.value) return
      await calendarApi.animal.new({
        date: date.value,
        startTime: new Date(`1970-01-01T${start.value}`),
        endTime: new Date(`1970-01-01T${end.value}`),
        veterinarianId: selectedVet.value.id,
        animalId: selectAnimal.value?.id,
      })
    }
    emit('close')
  } catch (err) {
    formErrorStore.handle(err)
  }
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

    <!-- Type selector — masqué pour directeur et référant -->
    <div v-if="canCreateAnimal" class="type-selector">
      <el-button
        :type="MEETING_COLORS.INTERNAL"
        :plain="type !== 'INTERNAL'"
        :icon="ChatDotRound"
        class="type-btn"
        @click="type = 'INTERNAL'"
      >
        Réunion
      </el-button>
      <el-button
        :type="MEETING_COLORS.ANIMAL"
        :plain="type !== 'ANIMAL'"
        :icon="FirstAidKit"
        class="type-btn"
        @click="type = 'ANIMAL'"
      >
        Rendez-vous
      </el-button>
    </div>

    <!-- Bandeau informatif pour directeur et référant -->
    <div v-else class="type-info-banner">
      <el-icon><ChatDotRound /></el-icon>
      Réunion interne uniquement
    </div>

    <!-- Form -->
    <div class="form">
      <!-- ANIMAL : client + animal + vétérinaire -->
      <template v-if="type === 'ANIMAL'">
        <SearchSelectSingle
          v-model="selectedClient"
          :items="clients"
          display-key="lastname"
          secondary-key="firstname"
          placeholder="Rechercher un client..."
        />
        <SearchSelectSingle
          v-model="selectAnimal"
          :items="animals"
          display-key="name"
          placeholder="Rechercher un animal..."
        />
        <SearchSelectSingle
          v-model="selectedVet"
          :items="vets"
          display-key="lastname"
          secondary-key="firstname"
          placeholder="Rechercher un vétérinaire..."
          :locked="isVetLocked"
        />
      </template>

      <!-- INTERNAL : titre + participants + lieu -->
      <template v-if="type === 'INTERNAL'">
        <div class="field">
          <label class="field-label">Titre</label>
          <el-input v-model="title" placeholder="Nom de la réunion" size="large" />
        </div>
        <SearchSelectMultiple
          v-model="participants"
          :items="staffs"
          display-key="lastname"
          secondary-key="firstname"
          placeholder="Rechercher des participants..."
        />
        <div class="field">
          <label class="field-label">Lieu</label>
          <el-input v-model="location" placeholder="Salle, adresse..." size="large">
            <template #prefix>
              <el-icon><Location /></el-icon>
            </template>
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
    background-color: var(--el-color-#{meeting-color('internal')});
  }

  &.dot-animal {
    background-color: var(--el-color-#{meeting-color('animal')});
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
}

// ── Bandeau info rôle restreint ───────────────────────────────────────────────

.type-info-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-color-#{meeting-color('internal')}-light-9, #f5f0fb);
  color: var(--el-color-#{meeting-color('internal')}, #9f6de0);
  font-size: 13px;
  font-weight: var(--fw-medium);
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

// ── Calendrier compact ────────────────────────────────────────────────────────

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
      font-weight: var(--fw-bold);
      font-size: 15px;
    }

    .el-button-group .el-button {
      padding: 4px 10px;
      font-size: 12px;
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

// ── Horaires ──────────────────────────────────────────────────────────────────

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
    background: var(--el-color-#{meeting-color('internal')});
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
