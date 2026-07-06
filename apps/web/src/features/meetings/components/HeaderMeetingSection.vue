<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft, Edit, Check, Delete } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import type { UserStore } from '@/stores/authStore'
import ModalScope from './internal-meeting/ModalScope.vue'

const { editing, isRecurringOccurrence, isUpcoming } = defineProps<{
  editing: boolean
  isRecurringOccurrence?: boolean
  isUpcoming: boolean
  user: UserStore
}>()

const emit = defineEmits<{
  edit: []
  save: [scope: 'single' | 'all']
  cancel: []
  delete: [scope: 'single' | 'all']
}>()
const router = useRouter()
const showScopeDialog = ref(false)
const pendingAction = ref<'save' | 'delete' | null>(null)

function onSaveClick() {
  if (isRecurringOccurrence) {
    pendingAction.value = 'save'
    showScopeDialog.value = true
  } else {
    emit('save', 'single')
  }
}

function onDeleteClick() {
  if (isRecurringOccurrence) {
    pendingAction.value = 'delete'
    showScopeDialog.value = true
  } else {
    emit('delete', 'single')
  }
}

function confirmScope(scope: 'single' | 'all') {
  showScopeDialog.value = false
  if (pendingAction.value === 'save') emit('save', scope)
  if (pendingAction.value === 'delete') emit('delete', scope)
  pendingAction.value = null
}
</script>

<template>
  <div class="page-header">
    <el-button text @click="router.back()">
      <el-icon><ArrowLeft /></el-icon>
      Retour
    </el-button>

    <div class="header-actions">
      <el-button v-if="!editing && user?.role !== 'CLIENT'" @click="emit('edit')" :icon="Edit">
        Modifier
      </el-button>
      <el-button
        v-if="editing && user?.role !== 'CLIENT'"
        type="success"
        @click="() => onSaveClick()"
        :icon="Check"
      >
        Enregistrer
      </el-button>
      <el-button type="danger" v-if="editing && user?.role !== 'CLIENT'" @click="emit('cancel')">
        Annuler
      </el-button>
      <el-button v-if="isUpcoming" type="danger" plain @click="onDeleteClick" :icon="Delete">
        Supprimer
      </el-button>
    </div>
  </div>
  <ModalScope @on-confirm="(scope) => confirmScope(scope)" v-model="showScopeDialog" />
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.dialog-text {
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-regular);
  line-height: 1.6;
  margin: 0 0 var(--spacing-lg) 0;
}
</style>
