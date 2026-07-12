<script setup lang="ts">
import type { Vaccine } from '@armali/schemas'

defineProps<{
  vaccine: Vaccine | null
  loading: boolean
}>()

const visible = defineModel<boolean>('visible', { required: true })

const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <el-dialog v-model="visible" title="Supprimer le vaccin" width="440px" align-center>
    <p v-if="vaccine" class="dialog-body">
      Confirmer la suppression du vaccin <strong>« {{ vaccine.act?.name }} »</strong> ?<br />
      Cette action est irréversible.
    </p>
    <template #footer>
      <el-button @click="visible = false">Annuler</el-button>
      <el-button type="danger" :loading="loading" @click="emit('confirm')"> Supprimer </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.dialog-body {
  margin: 0;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}
</style>
