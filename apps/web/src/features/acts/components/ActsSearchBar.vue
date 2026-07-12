<script setup lang="ts">
const search = defineModel<string>({ required: true })
</script>

<template>
  <el-input
    v-model="search"
    placeholder="Rechercher un acte par nom..."
    clearable
    class="acts-search"
  >
    <template #prefix>
      <el-icon><Search /></el-icon>
    </template>
  </el-input>
</template>

<style scoped lang="scss">
.acts-search {
  max-width: 320px;
  margin-bottom: var(--spacing-md);
}
</style>
