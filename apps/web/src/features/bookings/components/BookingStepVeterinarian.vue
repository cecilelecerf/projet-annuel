<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { User } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { bookingApi } from '../booking.api'
import type { BookingClinic, BookingVet, BookingSlot } from '@armali/schemas'
import { calendarApi } from '@/features/meetings/api/calendar.api'

dayjs.locale('fr')

const props = defineProps<{
  clinic: BookingClinic
  date?: string
  petId?: string
  specialityId?: string | null
}>()

const selectedVet = defineModel<BookingVet | null>('vet', { required: true })
const selectedSlot = defineModel<BookingSlot | null>('slot', { required: true })

const calendarDate = ref(props.date ? new Date(props.date) : new Date())
const vets = ref<BookingVet[]>([])
const slots = ref<BookingSlot[]>([])
const vetsLoading = ref(false)
const slotsLoading = ref(false)

async function loadVets() {
  vetsLoading.value = true
  try {
    vets.value = await bookingApi.getClinicVets({
      clinicId: props.clinic.id,
      date: props.date,
      specialityId: props.specialityId ?? undefined,
      petId: props.petId,
    })
  } finally {
    vetsLoading.value = false
  }
}

async function loadSlots() {
  if (!selectedVet.value) return
  slotsLoading.value = true
  try {
    slots.value = await calendarApi.getVetSlot({
      veterinarianId: selectedVet.value.id,
      clinicId: props.clinic.id,
      date: dayjs(calendarDate.value).format('YYYY-MM-DD'),
    })
  } catch (err) {
    console.log(err)
  } finally {
    slotsLoading.value = false
  }
}

watch(selectedVet, () => {
  selectedSlot.value = null
  loadSlots()
})

watch(calendarDate, () => {
  selectedSlot.value = null
  if (selectedVet.value) loadSlots()
})

await loadVets()

function formatSlot(slot: BookingSlot) {
  return dayjs(slot.startTime).format('H[h]mm')
}

const morningSlots = computed(() => slots.value.filter((s) => dayjs(s.startTime).hour() < 12))
const afternoonSlots = computed(() => slots.value.filter((s) => dayjs(s.startTime).hour() >= 12))
</script>

<template>
  <div class="step">
    <div class="step-intro">
      <h2 class="step-title">Choisissez un vétérinaire</h2>
      <p class="step-desc">
        <el-icon><Location /></el-icon>
        {{ clinic.name }} — {{ clinic.address }}
      </p>
    </div>

    <div class="layout">
      <!-- Colonne gauche : vetos -->
      <div class="vet-column">
        <h3 class="column-label">Vétérinaires disponibles</h3>

        <el-skeleton v-if="vetsLoading" :rows="3" animated />

        <div v-else class="vet-list">
          <button
            v-for="vet in vets"
            :key="vet.id"
            class="vet-card"
            :class="{ 'vet-card--selected': selectedVet?.id === vet.id }"
            @click="selectedVet = vet"
          >
            <el-avatar :size="40" class="vet-avatar">
              {{ vet.user.firstname.charAt(0) }}{{ vet.user.lastname.charAt(0) }}
            </el-avatar>
            <div class="vet-info">
              <span class="vet-name">Dr {{ vet.user.firstname }} {{ vet.user.lastname }}</span>
              <div class="vet-specialities">
                <el-tag
                  v-for="s in vet.specialities"
                  :key="s.id"
                  size="small"
                  round
                  type="primary"
                  >{{ s.name }}</el-tag
                >
              </div>
            </div>
            <el-icon v-if="selectedVet?.id === vet.id" class="vet-check"><Check /></el-icon>
          </button>

          <div v-if="!vetsLoading && vets.length === 0" class="empty">
            <p>Aucun vétérinaire disponible pour cette clinique.</p>
          </div>
        </div>
      </div>

      <!-- Colonne droite : créneaux -->
      <div class="slots-column">
        <h3 class="column-label">Créneaux disponibles</h3>

        <div v-if="!selectedVet" class="slots-empty">
          <el-icon style="font-size: 32px; color: var(--el-text-color-placeholder)"
            ><User
          /></el-icon>
          <p>Sélectionnez un vétérinaire pour voir ses disponibilités.</p>
        </div>

        <template v-else>
          <el-date-picker
            v-model="calendarDate"
            type="date"
            :disabled-date="(d: Date) => d < new Date()"
            style="width: 100%"
          />

          <el-skeleton v-if="slotsLoading" :rows="2" animated />

          <div v-else-if="slots.length === 0" class="slots-empty">
            <p>Aucun créneau disponible ce jour.</p>
          </div>

          <template v-else>
            <div v-if="morningSlots.length > 0" class="slots-section">
              <span class="slots-period">🌅 Matin</span>
              <div class="slots-grid">
                <button
                  v-for="slot in morningSlots"
                  :key="slot.startTime.toString()"
                  class="slot-btn"
                  :class="{ 'slot-btn--selected': selectedSlot?.startTime === slot.startTime }"
                  @click="selectedSlot = slot"
                >
                  {{ formatSlot(slot) }}
                </button>
              </div>
            </div>

            <div v-if="afternoonSlots.length > 0" class="slots-section">
              <span class="slots-period">🌇 Après-midi</span>
              <div class="slots-grid">
                <button
                  v-for="slot in afternoonSlots"
                  :key="slot.startTime.toString()"
                  class="slot-btn"
                  :class="{ 'slot-btn--selected': selectedSlot?.startTime === slot.startTime }"
                  @click="selectedSlot = slot"
                >
                  {{ formatSlot(slot) }}
                </button>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.step {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}
.step-intro {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.step-title {
  font-family: 'Nunito', sans-serif;
  font-size: 22px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}
.step-desc {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}
.layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
.column-label {
  font-size: 12px;
  font-weight: var(--fw-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--el-text-color-secondary);
  margin: 0 0 var(--spacing-md);
}
.vet-column,
.slots-column {
  display: flex;
  flex-direction: column;
}
.vet-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.vet-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  cursor: pointer;
  text-align: left;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.15s;
  width: 100%;
  &:hover {
    border-color: var(--el-color-primary-light-5);
  }
  &--selected {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}
.vet-avatar {
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary-dark-2);
  font-size: 14px;
  font-weight: var(--fw-bold);
  flex-shrink: 0;
}
.vet-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.vet-name {
  font-size: 14px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}
.vet-specialities {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.vet-check {
  color: var(--el-color-primary);
  font-size: 16px;
  flex-shrink: 0;
}
.slots-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-2xl) var(--spacing-lg);
  border: 1px dashed var(--el-border-color);
  border-radius: var(--radius-lg);
  text-align: center;
  p {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}
.slots-section {
  margin-top: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.slots-period {
  font-size: 12px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
}
.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: var(--spacing-xs);
}
.slot-btn {
  padding: 8px 4px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: var(--fw-medium);
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }
  &--selected {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary);
    color: var(--el-color-white);
    font-weight: var(--fw-semibold);
  }
}
.empty {
  padding: var(--spacing-xl);
  text-align: center;
  p {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}
</style>
