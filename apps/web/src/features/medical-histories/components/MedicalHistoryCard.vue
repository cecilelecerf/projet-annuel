<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import dayjs from 'dayjs'
import { actTypeIcon, actTypeLabel, getActInfo } from '../utils.ts'
import type { MedicalHistoryMeta } from '@armali/schemas'
import ActPerformerInfo from './act-details/ActPerformerInfo.vue'
import ActSurgeryDetails from './act-details/ActSurgeryDetails.vue'
import ActImagingDetails from './act-details/ActImagingDetails.vue'
import ActAnalysisDetails from './act-details/ActAnalysisDetails.vue'
import ActHospitalizationDetails from './act-details/ActHospitalizationDetails.vue'
import { getActTypeBadge } from '@/features/acts/utils.ts'
import { medicalHistoriesApi } from '../medical-history.api.ts'

const props = defineProps<{ act: MedicalHistoryMeta }>()

const { user } = useAuthStore()
const emit = defineEmits<{ edit: []; delete: [] }>()

const actInfo = getActInfo(props.act)
const badgeColor = actInfo?.type ? getActTypeBadge(actInfo.type) : null

const onDelete = async () => {
  await medicalHistoriesApi.delete(props.act.id)
  emit('delete')
}
</script>

<template>
  <div class="act-card">
    <div>
      <div class="act-card-header" :class="badgeColor ? `header-${badgeColor}` : ''">
        <div class="act-type-badge" :class="badgeColor ? `badge-${badgeColor}` : ''">
          <el-icon><component :is="actTypeIcon(actInfo?.type)" /></el-icon>
          <span>{{ actTypeLabel(actInfo?.type) }}</span>
        </div>
        <p v-if="act.priceApplied" class="act-price">{{ Number(act.priceApplied).toFixed(2) }} €</p>
      </div>

      <div class="act-card-body">
        <span class="act-name">{{ actInfo?.name }}</span>
        <span v-if="act.notes" class="act-notes">{{ act.notes }}</span>
      </div>

      <ActPerformerInfo v-if="act.performedBy" :performed-by="act.performedBy" />

      <ActSurgeryDetails v-if="act.surgery" :surgery="act.surgery" />
      <ActImagingDetails v-if="act.imaging" :imaging="act.imaging" />
      <ActAnalysisDetails v-if="act.analysis" :analysis="act.analysis" />
      <ActHospitalizationDetails
        v-if="act.hospitalization"
        :hospitalization="act.hospitalization"
      />
    </div>

    <div class="act-card-footer" v-if="user?.role === 'VETERINARIAN'">
      <span class="act-date">
        {{ dayjs(act.performedAt).format('D MMM YYYY à H[h]mm') }}
      </span>
      <div class="act-actions">
        <el-button text size="small" @click="emit('edit')">
          <el-icon><Edit /></el-icon>
        </el-button>
        <el-button text size="small" type="danger" @click="onDelete">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.act-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--el-bg-color);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-sm);
}

.act-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--el-fill-color-light);
  border-top-left-radius: var(--radius-sm);
  border-top-right-radius: var(--radius-sm);

  &.header-purple {
    background: var(--el-color-purple-light-7);
    color: var(--el-color-purple-dark-5);
  }
  &.header-pink {
    background: var(--el-color-pink-light-7);
    color: var(--el-color-pink-dark-5);
  }
  &.header-teal {
    background: var(--el-color-teal-light-7);
    color: var(--el-color-teal-dark-5);
  }
  &.header-yellow {
    background: var(--el-color-yellow-light-7);
    color: var(--el-color-yellow-dark-5);
  }
  &.header-orange {
    background: var(--el-color-orange-light-7);
    color: var(--el-color-orange-dark-5);
  }
  &.header-indigo {
    background: var(--el-color-indigo-light-7);
    color: var(--el-color-indigo-dark-5);
  }
}

.act-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: var(--fw-semibold);
  padding: 2px 8px;
  border-radius: var(--radius-full);

  @include above('sm') {
    font-size: 12px;
    gap: 6px;
    padding: 2px 10px;
  }

  &.badge-purple {
    background: var(--el-color-purple-light-9);
    color: var(--el-color-purple-dark-2);
  }
  &.badge-pink {
    background: var(--el-color-pink-light-9);
    color: var(--el-color-pink-dark-2);
  }
  &.badge-teal {
    background: var(--el-color-teal-light-9);
    color: var(--el-color-teal-dark-2);
  }
  &.badge-yellow {
    background: var(--el-color-yellow-light-9);
    color: var(--el-color-yellow-dark-2);
  }
  &.badge-orange {
    background: var(--el-color-orange-light-9);
    color: var(--el-color-orange-dark-2);
  }
  &.badge-indigo {
    background: var(--el-color-indigo-light-9);
    color: var(--el-color-indigo-dark-2);
  }
}

.act-price {
  font-size: 14px;
  font-weight: var(--fw-bold);

  @include above('sm') {
    font-size: 15px;
  }
}

.act-card-body {
  padding-block: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.act-name {
  font-size: 14px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);

  @include above('sm') {
    font-size: 15px;
  }
}

.act-notes {
  font-size: 12px;
  color: var(--el-text-color-secondary);

  @include above('sm') {
    font-size: 13px;
  }
}

.act-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) var(--spacing-md);
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
}

.act-date {
  font-size: 11px;
  color: var(--el-text-color-placeholder);

  @include above('sm') {
    font-size: 12px;
  }
}

.act-actions {
  display: flex;
  gap: 4px;
}
</style>
