<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { animalApi } from '../api'
import { useNotify } from '@/composables/useNotify'
import type { AnimalId, AnimalDeletionReason } from '@armali/schemas'

const props = defineProps<{
  animalId: AnimalId
  animalName: string
}>()

const notify = useNotify()
const router = useRouter()

const visible = ref(false)
const selectedReasons = ref<AnimalDeletionReason[]>([])
const comment = ref('')
const loading = ref(false)
const errorMsg = ref('')

const reasonOptions: { value: AnimalDeletionReason; label: string }[] = [
  { value: 'DECEASED', label: 'Décès de l’animal' },
  { value: 'NO_LONGER_NEEDS_FOLLOWUP', label: 'Plus besoin de suivi' },
  { value: 'OTHER', label: 'Autre' },
]

function open() {
  visible.value = true
  selectedReasons.value = []
  comment.value = ''
  errorMsg.value = ''
}

async function confirmDelete() {
  if (selectedReasons.value.length === 0) {
    errorMsg.value = 'Sélectionnez au moins une raison'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    await animalApi.delete(props.animalId, {
      reasons: selectedReasons.value,
      comment: comment.value || undefined,
    })
    notify.success(`${props.animalName} a été supprimé`)
    visible.value = false
    router.push({ name: 'CLIENT.Home' })
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Erreur lors de la suppression'
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="`Supprimer ${animalName}`"
    width="420px"
    :close-on-click-modal="false"
  >
    <el-alert
      title="Cette action est irréversible. Toutes les données de cet animal seront définitivement supprimées."
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom: 16px"
    />

    <p style="margin-bottom: 8px">Pourquoi souhaitez-vous supprimer cet animal ?</p>
    <el-checkbox-group v-model="selectedReasons">
      <el-checkbox
        v-for="option in reasonOptions"
        :key="option.value"
        :value="option.value"
        style="display: block"
      >
        {{ option.label }}
      </el-checkbox>
    </el-checkbox-group>

    <el-input
      v-if="selectedReasons.includes('OTHER')"
      v-model="comment"
      type="textarea"
      :rows="2"
      maxlength="500"
      placeholder="Précisez la raison..."
      style="margin-top: 12px"
    />

    <el-alert
      v-if="errorMsg"
      :title="errorMsg"
      type="error"
      show-icon
      :closable="false"
      style="margin-top: 12px"
    />

    <template #footer>
      <el-button @click="visible = false">Annuler</el-button>
      <el-button type="danger" :loading="loading" @click="confirmDelete">
        Supprimer
      </el-button>
    </template>
  </el-dialog>
</template>
