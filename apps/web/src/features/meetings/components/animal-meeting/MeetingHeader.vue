<script setup lang="ts">
import { Check, CircleCheck, Delete, Edit } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import type { AnimalMeetingMeta, AnimalMeetingStatus } from '@armali/schemas'
import type { UserStore } from '@/stores/authStore'

defineProps<{
  meeting: AnimalMeetingMeta
  isEditing: boolean
  user: UserStore | null
  status: AnimalMeetingStatus
}>()

const emit = defineEmits<{
  edit: []
  cancel: []
  save: []
  delete: []
  'mark-done': []
}>()

const router = useRouter()
</script>

<template>
  <div class="page-header">
    <el-button text @click="router.back()">
      <el-icon><ArrowLeft /></el-icon>
      Retour
    </el-button>
    <div class="header-actions">
      <el-button
        v-if="!isEditing && status === 'SCHEDULED' && user?.role !== 'CLIENT'"
        type="success"
        plain
        @click="emit('mark-done')"
        :icon="CircleCheck"
      >
        Marquer comme effectuée
      </el-button>
      <el-button v-if="!isEditing && user?.role !== 'CLIENT'" @click="emit('edit')" :icon="Edit">
        Modifier
      </el-button>
      <el-button
        v-if="isEditing && user?.role !== 'CLIENT'"
        type="primary"
        @click="emit('save')"
        :icon="Check"
      >
        Enregistrer
      </el-button>
      <el-button v-if="isEditing && user?.role !== 'CLIENT'" @click="emit('cancel')">
        Annuler
      </el-button>
      <el-button
        v-if="new Date(meeting.date) > new Date() && user?.role !== 'CLIENT'"
        type="danger"
        plain
        @click="emit('delete')"
        :icon="Delete"
      >
        Supprimer
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
