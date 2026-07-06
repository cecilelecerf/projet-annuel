<script setup lang="ts">
const emit = defineEmits<{
  onConfirm: [scope: 'single' | 'all']
}>()
const showScopeDialog = defineModel<boolean>()
</script>
<template>
  <el-dialog v-model="showScopeDialog" title="Appliquer la modification" width="420px" align-center>
    <p class="dialog-text">
      Cette réunion fait partie d'une série récurrente. Veux-tu appliquer cette modification
      uniquement à cette date, ou à toute la série ?
    </p>
    <div class="scope-options">
      <button class="scope-option" @click="emit('onConfirm', 'single')">
        <el-icon class="scope-icon"><Calendar /></el-icon>
        <div class="scope-text">
          <span class="scope-title">Cette date uniquement</span>
          <span class="scope-desc">Les autres occurrences restent inchangées</span>
        </div>
      </button>

      <button class="scope-option" @click="emit('onConfirm', 'all')">
        <el-icon class="scope-icon"><Refresh /></el-icon>
        <div class="scope-text">
          <span class="scope-title">Toute la récurrence</span>
          <span class="scope-desc">À partir d'aujourd'hui, sans toucher au passé</span>
        </div>
      </button>
    </div>
    <template #footer>
      <el-button @click="showScopeDialog = false">Annuler</el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.scope-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.scope-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.scope-option:hover {
  border-color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.scope-icon {
  font-size: 20px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.scope-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.scope-title {
  font-size: var(--el-font-size-base);
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}

.scope-desc {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
}
</style>
