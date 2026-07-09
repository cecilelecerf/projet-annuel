<script setup lang="ts">
import type { Race } from '@armali/schemas'
import { Delete, Edit } from '@element-plus/icons-vue'

defineProps<{
  races: Race[]
  loading: boolean
}>()

const emit = defineEmits<{
  edit: [race: Race]
  delete: [race: Race]
}>()
</script>

<template>
  <el-table v-loading="loading" :data="races" size="small" empty-text="Aucune race">
    <el-table-column prop="name" label="Nom" min-width="160" />
    <el-table-column label="Actions" width="110" fixed="right">
      <template #default="{ row }">
        <div class="actions-column">
          <el-button size="small" type="primary" plain :icon="Edit" @click="emit('edit', row)" />
          <el-button size="small" type="danger" plain :icon="Delete" @click="emit('delete', row)" />
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<style lang="scss" scoped>
.actions-column {
  display: flex;
  justify-content: center;
}
</style>
