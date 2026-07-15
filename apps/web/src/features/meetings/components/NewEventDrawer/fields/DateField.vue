<script setup lang="ts">
const date = defineModel<Date>('date', { required: true })
</script>

<template>
  <div class="field">
    <label class="field-label">Date</label>
    <el-calendar v-model="date" class="compact-calendar" />
  </div>
</template>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.field-label {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

:deep(.compact-calendar) {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-md);
  overflow: hidden;

  .el-calendar__header {
    padding: var(--spacing-sm) var(--spacing-md);
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-sm);

    .el-calendar__title {
      font-weight: var(--fw-bold);
      font-size: 15px;
    }

    .el-button-group .el-button {
      padding: 4px 10px;
      font-size: 12px;
    }
  }

  .el-calendar__body {
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .el-calendar-table {
    th {
      font-size: 11px;
      font-weight: var(--fw-semibold);
      color: var(--el-text-color-placeholder);
      text-transform: uppercase;
      padding: var(--spacing-xs) 0;
    }

    td {
      border: none;
    }

    .el-calendar-day {
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      font-size: 13px;
      padding: 0;
      transition: background 0.15s;

      &:hover {
        background: var(--el-fill-color);
      }
    }

    td.is-selected .el-calendar-day {
      background: var(--el-color-primary);
      color: white;
      font-weight: var(--fw-semibold);
    }

    td.is-today .el-calendar-day {
      color: var(--el-color-primary);
      font-weight: var(--fw-bold);
    }

    td.is-today.is-selected .el-calendar-day {
      color: white;
    }
  }
}
</style>
