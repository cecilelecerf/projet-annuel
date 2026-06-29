<script setup lang="ts">
import { WarningFilled } from '@element-plus/icons-vue'

const visible = defineModel<boolean>({ required: true })

const {
  title = 'Confirmer la suppression',
  message = 'Cette action est irréversible.',
  confirmText = 'Supprimer',
  cancelText = 'Annuler',
  loading = false,
} = defineProps<{
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function onCancel() {
  if (loading) return
  visible.value = false
  emit('cancel')
}

function onConfirm() {
  emit('confirm')
}
</script>

<template>
  <el-dialog
    v-model="visible"
    width="400px"
    align-center
    :close-on-click-modal="!loading"
    :show-close="!loading"
    @close="onCancel"
  >
    <div class="confirm-content">
      <span class="icon-wrapper">
        <el-icon class="warning-icon"><WarningFilled /></el-icon>
      </span>
      <h3 class="confirm-title">{{ title }}</h3>
      <p class="confirm-message">
        <slot>{{ message }}</slot>
      </p>
    </div>

    <template #footer>
      <el-button :disabled="loading" @click="onCancel">{{ cancelText }}</el-button>
      <el-button type="danger" :loading="loading" @click="onConfirm">{{ confirmText }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.confirm-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--el-color-danger-light-9);
}

.warning-icon {
  font-size: 24px;
  color: var(--el-color-danger);
}

.confirm-title {
  font-family: 'Nunito', sans-serif;
  font-size: var(--el-font-size-large);
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.confirm-message {
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  margin: 0;
}
</style>
