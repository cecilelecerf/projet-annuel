<script setup lang="ts">
import { ref } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { useFormErrorStore } from '@/stores/formErrorStore'
import { useRouter } from 'vue-router'
import type {
  BookingAnimal,
  BookingClinic,
  BookingVet,
  BookingSlot,
  SpecialityId,
} from '@armali/schemas'
import { meetingApi } from '@/features/meetings/api/meeting.api'
import { MEETING_COLORS } from '@/utils/meetingColor'
import { formatDate, subtractTime } from '../utils'

dayjs.locale('fr')

const props = defineProps<{
  animal: BookingAnimal
  clinic: BookingClinic
  vet: BookingVet
  selectedSlot: BookingSlot
  reason?: string
  specialityId?: SpecialityId | null
}>()

const emit = defineEmits<{ confirmed: [] }>()

const formError = useFormErrorStore()
const router = useRouter()
const confirming = ref(false)
const confirmed = ref(false)

async function confirm() {
  confirming.value = true
  formError.clear()
  try {
    await meetingApi.animal.new({
      animalId: props.animal.id,
      veterinarianId: props.vet.id,
      date: props.selectedSlot.date,
      startTime: props.selectedSlot.startTime,
      endTime: props.selectedSlot.endTime,
      specialityId: props.specialityId ?? null,
      description: props.reason || null,
      clinicId: props.clinic.id,
    })
    confirmed.value = true
    emit('confirmed')
  } catch (err) {
    formError.handle(err)
  } finally {
    confirming.value = false
  }
}
</script>

<template>
  <!-- Succès -->
  <div v-if="confirmed" class="success">
    <div class="success-icon">✅</div>
    <h2 class="success-title">Rendez-vous confirmé !</h2>
    <p class="success-desc">
      Un email de confirmation a été envoyé.<br />
      Vous pouvez retrouver ce rendez-vous dans votre espace.
    </p>
    <div class="success-actions">
      <el-button type="primary" @click="router.push('/meetings')">Voir mes rendez-vous</el-button>
      <el-button @click="router.push('/')">Retour à l'accueil</el-button>
    </div>
  </div>

  <!-- Résumé -->
  <template v-else>
    <div class="step">
      <div class="step-intro">
        <h2 class="step-title">Confirmez votre rendez-vous</h2>
        <p class="step-desc">Vérifiez les informations avant de confirmer.</p>
      </div>

      <div class="summary-card">
        <div class="summary-row">
          <span class="summary-label">Animal</span>
          <div class="summary-value">
            <span class="summary-main">{{ animal.name }}</span>
            <span class="summary-sub">{{ animal.race.pet.name }} · {{ animal.race.name }}</span>
          </div>
        </div>
        <div class="summary-divider" />
        <div class="summary-row">
          <span class="summary-label">Clinique</span>
          <div class="summary-value">
            <span class="summary-main">{{ clinic.name }}</span>
            <span class="summary-sub">{{ clinic.address }}</span>
          </div>
        </div>
        <div class="summary-divider" />
        <div class="summary-row">
          <span class="summary-label">Vétérinaire</span>
          <div class="summary-value">
            <span class="summary-main">Dr {{ vet.user.firstname }} {{ vet.user.lastname }}</span>
            <div class="vet-tags">
              <el-tag
                v-for="s in vet.specialities"
                :key="s.id"
                size="small"
                round
                :type="MEETING_COLORS.ANIMAL"
              >
                {{ s.name }}
              </el-tag>
            </div>
          </div>
        </div>
        <div class="summary-divider" />
        <div class="summary-row">
          <span class="summary-label">Date & heure</span>
          <div class="summary-value">
            <span class="summary-main summary-date">{{ formatDate(selectedSlot.date) }}</span>
            <span class="summary-sub">{{
              subtractTime(selectedSlot.startTime, selectedSlot.endTime)
            }}</span>
          </div>
        </div>
        <template v-if="reason">
          <div class="summary-divider" />
          <div class="summary-row">
            <span class="summary-label">Motif</span>
            <span class="summary-main">{{ reason }}</span>
          </div>
        </template>
      </div>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="Rappel"
        description="Les annulations sont possibles jusqu'à 48h avant le rendez-vous. Passé ce délai, contactez directement la clinique."
      />

      <el-button
        :type="MEETING_COLORS.ANIMAL"
        size="large"
        :loading="confirming"
        style="width: 100%"
        @click="confirm"
      >
        Confirmer le rendez-vous
      </el-button>
    </div>
  </template>
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
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}
.summary-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
.summary-row {
  display: flex;
  gap: var(--spacing-lg);
  align-items: flex-start;
}
.summary-label {
  font-size: 12px;
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--el-text-color-placeholder);
  min-width: 100px;
  flex-shrink: 0;
  padding-top: 2px;
}
.summary-value {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.summary-main {
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-#{meeting-color('animal')});
}
.summary-date {
  color: var(--el-color-#{meeting-color('animal')});
}
.summary-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.summary-divider {
  height: 1px;
  background: var(--el-border-color-lighter);
}
.vet-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 2px;
}
.success {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-3xl) var(--spacing-xl);
}
.success-icon {
  font-size: 4rem;
}
.success-title {
  font-family: 'Nunito', sans-serif;
  font-size: 24px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}
.success-desc {
  font-size: 15px;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
  margin: 0;
}
.success-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  justify-content: center;
}
</style>
