<script setup lang="ts">
import { useBooking } from '../composables/useBooking.ts'
import BookingStepAnimal from '../components/bookings/BookingStepAnimal.vue'
import BookingStepClinic from '../components/bookings/BookingStepClinic.vue'
import BookingStepVet from '../components/bookings/BookingStepVeterinarian.vue'
import BookingStepConfirm from '../components/bookings/BookingStepConfirm.vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { MEETING_COLORS } from '@/utils/meetingColor.ts'

const router = useRouter()

const {
  step,
  selectedAnimal,
  selectedSpecialityId,
  reason,
  filters,
  selectedClinic,
  selectedVet,
  selectedSlot,
  canGoNext,
  next,
  back,
  goTo,
  reset,
} = useBooking()

const STEPS = [
  { number: 1, label: 'Animal' },
  { number: 2, label: 'Clinique' },
  { number: 3, label: 'Vétérinaire & créneau' },
  { number: 4, label: 'Confirmation' },
]
</script>

<template>
  <div class="booking-page">
    <div class="booking-header">
      <button class="back-btn" @click="step > 1 ? back() : router.push('/')">
        <el-icon><ArrowLeft /></el-icon>
        {{ step > 1 ? 'Retour' : 'Accueil' }}
      </button>
      <span class="booking-title">Prendre rendez-vous</span>
    </div>

    <div class="stepper">
      <div
        v-for="s in STEPS"
        :key="s.number"
        class="stepper-step"
        :class="{
          'stepper-step--active': step === s.number,
          'stepper-step--done': step > s.number,
          'stepper-step--clickable': step > s.number,
        }"
        @click="step > s.number ? goTo(s.number as any) : undefined"
      >
        <div class="stepper-indicator">
          <span v-if="step > s.number" class="stepper-check">✓</span>
          <span v-else>{{ s.number }}</span>
        </div>
        <span class="stepper-label">{{ s.label }}</span>
        <div
          v-if="s.number < 4"
          class="stepper-line"
          :class="{ 'stepper-line--done': step > s.number }"
        />
      </div>
    </div>

    <div class="booking-content">
      <BookingStepAnimal
        v-if="step === 1"
        v-model:animal="selectedAnimal"
        v-model:speciality-id="selectedSpecialityId"
        v-model:reason="reason"
      />

      <BookingStepClinic
        v-else-if="step === 2 && selectedAnimal"
        :animal="selectedAnimal"
        :initial-speciality-id="selectedSpecialityId"
        v-model:filters="filters"
        v-model:clinic="selectedClinic"
      />

      <BookingStepVet
        v-else-if="step === 3 && selectedClinic && selectedAnimal"
        :clinic="selectedClinic"
        :date="filters.date"
        :pet-id="selectedAnimal.race.petId"
        :speciality-id="selectedSpecialityId"
        v-model:vet="selectedVet"
        v-model:slot="selectedSlot"
      />

      <BookingStepConfirm
        v-else-if="step === 4 && selectedAnimal && selectedClinic && selectedVet && selectedSlot"
        :animal="selectedAnimal"
        :clinic="selectedClinic"
        :vet="selectedVet"
        :selectedSlot="selectedSlot"
        :reason="reason"
        :speciality-id="selectedSpecialityId"
        @confirmed="reset"
      />
    </div>

    <div v-if="step < 4" class="booking-footer">
      <span class="step-counter">Étape {{ step }} sur 4</span>
      <el-button :type="MEETING_COLORS.ANIMAL" size="large" :disabled="!canGoNext" @click="next">
        {{ step === 3 ? 'Voir le récapitulatif' : 'Continuer' }} →
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.booking-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.booking-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: var(--spacing-xl);
}
.back-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  padding: 0;
  transition: color 0.15s;
  &:hover {
    color: var(--el-text-color-primary);
  }
}
.booking-title {
  font-family: 'Nunito', sans-serif;
  font-size: 18px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
}
.stepper {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-2xl);
}
.stepper-step {
  display: flex;
  align-items: center;
  flex: 1;
  gap: var(--spacing-sm);
  &--clickable {
    cursor: pointer;
  }
}
.stepper-indicator {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: var(--fw-bold);
  flex-shrink: 0;
  transition: all 0.2s;
  .stepper-step--active & {
    background: var(--el-color-#{meeting-color('animal')});
    color: var(--el-color-white);
  }
  .stepper-step--done & {
    background: var(--el-color-success);
    color: var(--el-color-white);
  }
  .stepper-step:not(.stepper-step--active):not(.stepper-step--done) & {
    background: var(--el-fill-color);
    color: var(--el-text-color-placeholder);
  }
}
.stepper-label {
  font-size: 13px;
  font-weight: var(--fw-medium);
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  .stepper-step--active & {
    color: var(--el-color-#{meeting-color('animal')});
    font-weight: var(--fw-semibold);
  }
  .stepper-step--done & {
    color: var(--el-color-success);
  }
  @media (max-width: 600px) {
    display: none;
  }
}
.stepper-line {
  flex: 1;
  height: 2px;
  background: var(--el-color-#{meeting-color('animal')}-light-5);
  margin: 0 var(--spacing-sm);
  transition: background 0.2s;
  &--done {
    background: var(--el-color-success);
  }
}
.booking-content {
  flex: 1;
}
.booking-footer {
  position: sticky;
  bottom: 0;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  padding: var(--spacing-md) 0;
  margin-top: var(--spacing-2xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.step-counter {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}
</style>
