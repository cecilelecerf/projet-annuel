<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { Prescription, MeetingId } from '@armali/schemas'
import PrescriptionCards from '@/features/prescriptions/components/PrescriptionCard.vue'
import { MEETING_COLORS } from '@/utils/meetingColor'

defineProps<{ prescriptions: Prescription[]; meetingId: MeetingId }>()
defineEmits<{ saved: [] }>()

const showForm = ref(false)
</script>

<template>
  <div class="section">
    <div class="section-label-row">
      <h3 class="section-label">
        <el-icon><Document /></el-icon>
        Prescriptions
        <span class="count-badge">{{ prescriptions.length }}</span>
      </h3>
      <el-button
        :type="MEETING_COLORS.ANIMAL"
        size="small"
        plain
        @click="showForm = true"
        :icon="Plus"
      >
        Ajouter
      </el-button>
    </div>

    <div v-if="prescriptions.length" class="prescriptions-list">
      <PrescriptionCards
        v-for="prescription in prescriptions"
        :key="prescription.id"
        :prescription="prescription"
      />
    </div>
    <p v-else class="empty-text">Aucune prescription réalisée</p>
  </div>
</template>

<style lang="scss" scoped>
.prescriptions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);

  @include above('lg') {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

.empty-text {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
  margin: 0;
}
</style>
