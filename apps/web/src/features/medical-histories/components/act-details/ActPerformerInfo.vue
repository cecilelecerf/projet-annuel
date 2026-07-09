<script setup lang="ts">
import type { MedicalHistoryMeta } from '@armali/schemas'

defineProps<{ performedBy: NonNullable<MedicalHistoryMeta['performedBy']> }>()
</script>

<template>
  <div class="act-performers">
    <el-avatar :size="24" :src="performedBy.veterinarian?.user?.avatarUrl" class="performer-avatar">
      {{ performedBy.veterinarian?.user?.firstname?.charAt(0) }}
    </el-avatar>
    <span class="performers-label"> Dr. {{ performedBy.veterinarian?.user?.lastname }} </span>
  </div>
</template>

<style lang="scss" scoped>
.act-performers {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding-block: var(--spacing-sm);
  flex-wrap: wrap;
}
.performer-avatar {
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: var(--fw-bold);
}
.performers-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
