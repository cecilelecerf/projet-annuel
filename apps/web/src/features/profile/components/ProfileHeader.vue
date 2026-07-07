<script setup lang="ts">
import type { UserRole } from '@armali/schemas'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Camera, Loading } from '@element-plus/icons-vue'
import { ROLE_THEME } from '../utils/roleTheme'
import { usersApi } from '@/features/users/user.api'

const props = defineProps<{
  firstname?: string
  lastname?: string
  role: UserRole
  avatarUrl?: string | null
}>()

const emit = defineEmits<{
  (e: 'avatar-updated', avatarUrl: string | null): void
}>()

const theme = ROLE_THEME[props.role]

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

  // Preview optimiste immédiate
  const localPreview = URL.createObjectURL(file)
  previewUrl.value = localPreview
  isUploading.value = true

  try {
    const { fileId } = await usersApi.avatar.upload({ file })
    const updatedUser = await usersApi.avatar.confirm({ fileId }) // 👈 étape manquante

    emit('avatar-updated', updatedUser.avatarUrl)
    ElMessage.success('Photo de profil mise à jour.')
  } catch (e) {
    // Rollback en cas d'échec
    console.error('Erreur upload avatar:', e)
    previewUrl.value = null

    ElMessage.error("Échec de l'envoi de la photo. Réessaie.")
  } finally {
    isUploading.value = false
    URL.revokeObjectURL(localPreview)
    input.value = '' // permet de re-sélectionner le même fichier
  }
}
</script>
<template>
  <div class="profil-header">
    <div class="profil-avatar-wrapper">
      <button
        type="button"
        class="profil-avatar"
        :class="{ 'is-uploading': isUploading }"
        :style="
          !previewUrl && !avatarUrl ? { background: theme.avatarBg, color: theme.avatarColor } : {}
        "
        :disabled="isUploading"
        @click="openFilePicker"
      >
        <img
          v-if="previewUrl || avatarUrl"
          :src="previewUrl ?? avatarUrl ?? ''"
          alt="Photo de profil"
          class="profil-avatar-img"
        />
        <span v-else>{{ firstname?.[0] }}{{ lastname?.[0] }}</span>

        <span class="profil-avatar-overlay">
          <el-icon v-if="isUploading" class="is-loading"><Loading /></el-icon>
          <el-icon v-else><Camera /></el-icon>
        </span>
      </button>

      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="profil-avatar-input"
        @change="onFileChange"
      />
    </div>

    <div>
      <h1 class="profil-name">{{ firstname }} {{ lastname }}</h1>
      <span class="profil-role" :style="{ background: theme.badgeBg, color: theme.badgeColor }">
        {{ theme.label }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profil-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
}

.profil-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.profil-avatar {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-3xl);
  font-weight: var(--fw-bold);
  overflow: hidden;
  border: none;
  padding: 0;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }

  &.is-uploading .profil-avatar-overlay {
    opacity: 1;
  }
}

.profil-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

// Icône (crayon/caméra) affichée en permanence en petit badge,
// et en overlay plein sur hover ou pendant l'upload
.profil-avatar-overlay {
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

.profil-avatar:hover .profil-avatar-overlay {
  opacity: 1;
}

.profil-avatar-input {
  display: none;
}

.profil-name {
  font-size: var(--fs-4xl);
  font-weight: var(--fw-bold);
  margin: 0 0 var(--spacing-xs);
}

.profil-role {
  border-radius: var(--radius-md);
  padding: 2px 10px;
  font-size: var(--fs-base);
  font-weight: var(--fw-medium);
}
</style>
