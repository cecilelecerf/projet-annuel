<script setup lang="ts">
import type { Prescription } from '@armali/schemas'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'

dayjs.locale('fr')

defineProps<{ prescription: Prescription }>()
</script>
<template>
  <div class="prescription-row">
    <div class="prescription-info">
      <span class="prescription-dates">
        Du {{ dayjs(prescription.startDate).format('D MMM') }}
        <template v-if="prescription.endDate">
          au {{ dayjs(prescription.endDate).format('D MMM YYYY') }}
        </template>
      </span>
      <el-tag
        :type="
          prescription.status === 'ACTIVE'
            ? 'success'
            : prescription.status === 'COMPLETED'
              ? 'info'
              : 'danger'
        "
        size="small"
        round
      >
        {{
          prescription.status === 'ACTIVE'
            ? 'Active'
            : prescription.status === 'COMPLETED'
              ? 'Terminée'
              : 'Annulée'
        }}
      </el-tag>
    </div>
    <div class="prescription-items">
      <span v-for="item in prescription.items" :key="item.id" class="prescription-item">
        {{ item.medicationName }} · {{ item.dosage }} · {{ item.frequency }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.prescriptions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.prescription-row {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.prescription-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.prescription-dates {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.prescription-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.prescription-item {
  font-size: 13px;
  color: var(--el-text-color-primary);
}
</style>
