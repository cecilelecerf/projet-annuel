<script lang="ts" setup>
import type { AnimalDetail, AnimalMeetingWithMeeting } from '@armali/schemas'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Camera, Loading } from '@element-plus/icons-vue'
import { animalApi } from '../api'

const { meetings, animal } = defineProps<{
  animal: AnimalDetail
  meetings: AnimalMeetingWithMeeting[]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)
const isUploading = ref(false)

const MAX_SIZE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function openFilePicker() {
  if (isUploading.value) return
  fileInput.value?.click()
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Format non supporté (JPEG, PNG ou WebP uniquement).'
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `L'image ne doit pas dépasser ${MAX_SIZE_MB} Mo.`
  }
  return null
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const error = validateFile(file)
  if (error) {
    ElMessage.error(error)
    input.value = ''
    return
  }

  const localPreview = URL.createObjectURL(file)
  previewUrl.value = localPreview
  isUploading.value = true

  try {
    const { fileId } = await animalApi.picture.upload({ id: animal.id, file })
    const updated = await animalApi.picture.confirm({ id: animal.id, fileId })
    previewUrl.value = updated.photoUrl
    ElMessage.success('Photo mise à jour.')
  } catch (e) {
    console.error('Erreur upload photo animal:', e)
    previewUrl.value = null
    ElMessage.error("Échec de l'envoi de la photo. Réessaie.")
  } finally {
    isUploading.value = false
    URL.revokeObjectURL(localPreview)
    input.value = ''
  }
}
const age = computed(() => {
  const years = dayjs().diff(dayjs(animal.dateOfBirth), 'year')
  const months = dayjs().diff(dayjs(animal.dateOfBirth), 'month') % 12
  if (years === 0) return `${months} mois`
  if (months === 0) return `${years} an${years > 1 ? 's' : ''}`
  return `${years} an${years > 1 ? 's' : ''} et ${months} mois`
})

const weightData = computed(
  () =>
    meetings
      ?.filter((m) => m.petWeight != null)
      .sort((a, b) => dayjs(a.meeting?.date).diff(dayjs(b.meeting?.date)))
      .map((m) => ({
        date: dayjs(m.meeting?.date).format('D MMM YY'),
        poids: Number(m.petWeight),
      })) ?? [],
)
const lastWeight = computed(() => {
  const meetingFiler = weightData.value?.filter((m) => m.poids != null)
  const last = meetingFiler.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))[
    meetingFiler.length - 1
  ]
  return last ? `${last.poids} kg` : '—'
})

const lastSize = computed(() => {
  const filetMeeting = meetings?.filter((m) => m.petSize != null)
  const last = filetMeeting.sort((a, b) => dayjs(a.meeting?.date).diff(dayjs(b.meeting?.date)))[
    filetMeeting.length - 1
  ]
  return last ? `${Number(last.petSize)} cm` : '—'
})
</script>

<template>
  <div class="profile-card">
    <button
      type="button"
      class="pet-avatar"
      :class="{ 'is-uploading': isUploading }"
      :disabled="isUploading"
      @click="openFilePicker"
    >
      <img
        v-if="previewUrl || animal.photoUrl"
        :src="previewUrl ?? animal.photoUrl ?? ''"
        alt="Photo de l'animal"
        class="pet-avatar-img"
      />
      <span v-else>{{ animal.name.charAt(0) }}</span>

      <span class="pet-avatar-overlay">
        <el-icon v-if="isUploading" class="is-loading"><Loading /></el-icon>
        <el-icon v-else><Camera /></el-icon>
      </span>
    </button>
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="pet-avatar-input"
      @change="onFileChange"
    />
    <h2 class="profile-name">{{ animal.name }}</h2>
    <span class="profile-breed"> {{ animal.race?.pet?.name }} · {{ animal.race?.name }} </span>
    <el-tag v-if="animal.status === 'DECEASED'" type="info" size="small" style="margin-top: 4px">
      Décédé
    </el-tag>

    <div class="profile-details">
      <div class="detail-row">
        <span class="detail-label">Âge</span>
        <span class="detail-value">{{ age }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Poids</span>
        <span class="detail-value">{{ lastWeight }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Taille</span>
        <span class="detail-value">{{ lastSize }}</span>
      </div>
      <div v-if="animal.activity" class="detail-row">
        <span class="detail-label">Activité</span>
        <el-rate :model-value="animal.activity / 2" disabled :max="5" />
      </div>
      <div class="detail-row">
        <span class="detail-label">Assurance santé</span>
        <span class="detail-value">
          {{ animal.hasInsurance ? (animal.insuranceProvider ?? 'Oui') : 'Non' }}
        </span>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl) var(--spacing-lg);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-xl);
  background: var(--el-bg-color);
  box-sizing: border-box;
  width: 100%;
}

.pet-avatar {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--el-color-success-light-7);
  color: var(--el-color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: var(--fw-bold);
  overflow: hidden;
  border: none;
  padding: 0;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }

  &.is-uploading .pet-avatar-overlay {
    opacity: 1;
  }
}

.pet-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pet-avatar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: var(--fs-lg);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.pet-avatar:hover .pet-avatar-overlay {
  opacity: 1;
}

.pet-avatar-input {
  display: none;
}

.profile-name {
  font-size: 22px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.profile-breed {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  width: 100%;
  margin-top: var(--spacing-sm);
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.detail-label {
  color: var(--el-text-color-secondary);
}

.detail-value {
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}
</style>
