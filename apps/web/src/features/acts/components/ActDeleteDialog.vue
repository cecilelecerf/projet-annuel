<script setup lang="ts">
import type { Act } from '@armali/schemas'

defineProps<{
  visible: boolean
  act: Act | null
  loading: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: []
}>()
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="Supprimer l'acte"
    width="440px"
    align-center
    @update:model-value="emit('update:visible', $event)"
  >
    <p v-if="act" class="dialog-body">
      Confirmer la suppression de l'acte <strong>« {{ act.name }} »</strong> ?<br />
      Cette action est irréversible.
    </p>
    <template #footer>
      <el-button @click="emit('update:visible', false)">Annuler</el-button>
      <el-button type="danger" :loading="loading" @click="emit('confirm')"> Supprimer </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.dialog-body {
  margin: 0;
  line-height: 1.7;
  color: var(--color-text-secondary);
}
</style>
