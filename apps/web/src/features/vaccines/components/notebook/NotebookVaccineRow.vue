<script setup lang="ts">
import type { VaccineMeta } from '@armali/schemas'
import dayjs from 'dayjs'

defineProps<{ vaccine: VaccineMeta }>()
</script>
<template>
  <div
    :key="vaccine.vaccineId"
    class="vaccine-row"
    :class="`status-${vaccine.status.toLowerCase()}`"
  >
    <span class="vaccine-name">{{ vaccine.vaccine?.act?.name }}</span>
    <span class="vaccine-date">
      {{
        vaccine.medicalHistory?.performedAt
          ? dayjs(vaccine.medicalHistory.performedAt).format('D MMM YYYY')
          : '—'
      }}
    </span>
    <span class="vaccine-date">
      {{ vaccine.nextDue ? dayjs(vaccine.nextDue).format('D MMM YYYY') : '—' }}
    </span>
    <el-tag
      :type="
        vaccine.status === 'UP_TO_DATE'
          ? 'success'
          : vaccine.status === 'OVERDUE'
            ? 'danger'
            : vaccine.status === 'MANDATORY_MISSING'
              ? 'warning'
              : vaccine.status === 'RECOMMENDED_MISSING'
                ? 'info'
                : ''
      "
      size="small"
      round
    >
      {{
        vaccine.status === 'UP_TO_DATE'
          ? 'À jour'
          : vaccine.status === 'OVERDUE'
            ? 'En retard'
            : vaccine.status === 'MANDATORY_MISSING'
              ? 'Obligatoire manquant'
              : vaccine.status === 'RECOMMENDED_MISSING'
                ? 'Recommandé'
                : 'Non applicable'
      }}
    </el-tag>
  </div>
</template>

<style lang="scss" scoped>
// ── Vaccins ───────────────────────────────────────────────────────────────────

.vaccine-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;

  &:last-child {
    border-bottom: none;
  }
}

.vaccine-name {
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}

.vaccine-date {
  color: var(--el-text-color-secondary);
}
</style>
