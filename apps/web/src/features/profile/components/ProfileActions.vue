<script setup lang="ts">
defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  edit: []
  logout: []
  delete: []
}>()
</script>

<template>
  <div class="profil-actions">
    <el-button type="primary" size="large" @click="emit('edit')"> Modifier mon profil </el-button>
    <el-button size="large" :loading="loading" @click="emit('logout')"> Se déconnecter </el-button>
    <el-button type="danger" size="large" plain @click="emit('delete')">
      Supprimer mon compte
    </el-button>
  </div>
</template>

<style scoped lang="scss">
.profil-actions {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}
</style>
