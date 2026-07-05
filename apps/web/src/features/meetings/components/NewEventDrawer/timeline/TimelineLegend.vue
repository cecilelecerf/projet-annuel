<script setup lang="ts"></script>

<template>
  <div class="timeline-legend">
    <span class="legend-item">
      <span class="legend-dot legend-dot--available" />
      Disponible
    </span>
    <span class="legend-item">
      <span class="legend-dot legend-dot--busy" />
      Déjà pris
    </span>
    <span class="legend-item">
      <span class="legend-dot legend-dot--off" />
      Hors dispo
    </span>
  </div>
</template>

<style lang="scss" scoped>
.timeline-legend {
  display: flex;
  gap: var(--spacing-md);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;

  &--available {
    background: var(--el-color-success-light-5);
  }

  &--busy {
    background: var(--el-color-danger-light-5);
  }

  &--off {
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
  }
}
</style>
