<script setup lang="ts">
import DateField from './DateField.vue'

const date = defineModel<Date>('date', { required: true })
const start = defineModel<string>('start', { required: true })
const end = defineModel<string>('end', { required: true })
</script>

<template>
  <DateField v-model:date="date" />

  <div class="field">
    <label class="field-label">Horaires</label>
    <div class="time-row">
      <div class="time-slot">
        <span class="time-label">De</span>
        <el-time-picker
          v-model="start"
          placeholder="09:00"
          format="HH:mm"
          value-format="HH:mm:ss"
          size="large"
          style="width: 100%"
        />
      </div>
      <div class="time-divider">→</div>
      <div class="time-slot">
        <span class="time-label">À</span>
        <el-time-picker
          v-model="end"
          placeholder="10:00"
          format="HH:mm"
          value-format="HH:mm:ss"
          size="large"
          style="width: 100%"
        />
      </div>
    </div>
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

.time-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.time-slot {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.time-label {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.time-divider {
  color: var(--el-text-color-placeholder);
  padding-top: 20px;
  font-size: 16px;
}
</style>
