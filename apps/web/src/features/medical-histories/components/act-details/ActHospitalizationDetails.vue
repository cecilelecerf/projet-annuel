<script setup lang="ts">
import dayjs from 'dayjs'
import type { MedicalHistory } from '@armali/schemas'

defineProps<{ hospitalization: NonNullable<MedicalHistory['hospitalization']> }>()
</script>

<template>
  <div class="act-details">
    <div class="details-grid">
      <div class="detail-item">
        <span class="detail-label">Admis le</span>
        <span class="detail-value">{{
          dayjs(hospitalization.admittedAt).format('D MMM YYYY')
        }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Sorti le</span>
        <span class="detail-value">
          {{
            hospitalization.dischargedAt
              ? dayjs(hospitalization.dischargedAt).format('D MMM YYYY')
              : 'En cours'
          }}
        </span>
      </div>
      <div v-if="hospitalization.boxNumber" class="detail-item">
        <span class="detail-label">Box</span>
        <span class="detail-value">{{ hospitalization.boxNumber }}</span>
      </div>
    </div>

    <div v-if="hospitalization.dailyReports?.length" class="daily-reports">
      <p class="daily-reports-label">Rapports journaliers</p>
      <div v-for="report in hospitalization.dailyReports" :key="report.id" class="daily-report-row">
        <span class="report-date">{{ dayjs(report.createdAt).format('D MMM') }}</span>
        <span v-if="report.weight" class="report-measure">{{ report.weight }} kg</span>
        <span v-if="report.temperature" class="report-measure">{{ report.temperature }}°C</span>
        <span class="report-notes">{{ report.notes }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../../styles/act-details';

.daily-reports {
  margin-top: var(--spacing-sm);
}
.daily-reports-label {
  font-size: 12px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  margin: 0 0 var(--spacing-xs);
}
.daily-report-row {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;

  @include above('sm') {
    font-size: 13px;
    flex-wrap: nowrap;
    align-items: center;
  }
  &:last-child {
    border-bottom: none;
  }
}
.report-date {
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  min-width: 50px;
}
.report-measure {
  color: var(--el-text-color-secondary);
  min-width: 60px;
}
.report-notes {
  flex: 1;
  color: var(--el-text-color-secondary);
  width: 100%;

  @include above('sm') {
    width: auto;
  }
}
</style>
