<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Document, Plus } from '@element-plus/icons-vue'
import { useDocumentUpload } from '../composables/useDocumentUpload'

const props = defineProps<{ medicalHistoryId: string }>()

const { files, loading, uploading, load, upload } = useDocumentUpload(props.medicalHistoryId)

const fileInput = ref<HTMLInputElement | null>(null)

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) upload(file)
  input.value = ''
}

onMounted(load)
</script>

<template>
  <div class="documents">
    <div class="documents-header">
      <span class="documents-label">Documents</span>
      <input
        ref="fileInput"
        type="file"
        accept="application/pdf,image/*"
        hidden
        :disabled="uploading"
        @change="onFileChange"
      />
      <el-button size="small" :icon="Plus" :loading="uploading" plain @click="triggerFileInput">
        Ajouter un document
      </el-button>
    </div>
    <div v-loading="loading" class="documents-list">
      <a
        v-for="file in files"
        :key="file.id"
        :href="file.url"
        target="_blank"
        class="document-item"
      >
        <el-icon><Document /></el-icon>
        <span class="document-name">{{ file.mimeType }}</span>
      </a>
      <p v-if="!loading && !files.length" class="empty-text">Aucun document</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.documents {
  padding: var(--spacing-sm) var(--spacing-md);
  border-top: 1px solid var(--el-border-color-lighter);
}

.documents-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
}

.documents-label {
  font-size: 11px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xs, 4px);
}

.document-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  color: var(--el-color-primary);
  font-size: 13px;
  text-decoration: none;
  transition: background 0.15s;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.empty-text {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
  margin: 0;
}
</style>
