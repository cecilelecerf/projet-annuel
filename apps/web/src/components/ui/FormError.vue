<script lang="ts" setup>
import { useFormErrorStore } from '@/stores/formErrorStore'
const store = useFormErrorStore()
</script>

<template>
  <Transition name="slide-down">
    <div v-if="store.error" class="form-error" @click="store.clear">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ store.error }}</span>
      <el-icon class="close"><Close /></el-icon>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.form-error {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-5);
  border-radius: var(--radius-md);
  color: var(--el-color-danger);
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  white-space: nowrap;

  .close {
    margin-left: var(--spacing-xs);
    opacity: 0.6;
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}
</style>
