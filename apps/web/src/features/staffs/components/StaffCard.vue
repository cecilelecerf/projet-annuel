<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import type { StaffMember, StaffRole } from '@armali/schemas'
import { useRouter } from 'vue-router'

const { withPress } = defineProps<{
  staff: StaffMember
  withPress?: boolean
}>()
const router = useRouter()
const { user } = useAuthStore()
const roleLabel: Record<StaffRole, string> = {
  DIRECTOR: 'Directeur',
  REFERENT: 'Référent',
  VETERINARIAN: 'Vétérinaire',
  SECRETARY: 'Secrétaire',
}
const roleTag: Record<StaffRole, string> = {
  DIRECTOR: 'danger',
  REFERENT: 'info',
  VETERINARIAN: 'success',
  SECRETARY: 'warning',
}

const goToDetail = (id: string) => {
  if (withPress) router.push({ name: `${user?.role.toUpperCase()}.Staff.Detail`, params: { id } })
}
</script>

<template>
  <div
    class="staff-item"
    :class="{ 'staff-item--pressable': withPress }"
    @click="goToDetail(staff.id)"
  >
    <div class="staff-avatar">{{ staff.firstname[0] }}{{ staff.lastname[0] }}</div>
    <div class="staff-info">
      <div class="staff-name">{{ staff.firstname }} {{ staff.lastname }}</div>
      <div class="staff-email">{{ staff.email }}</div>
    </div>
    <el-tag :type="roleTag[staff.role]" size="small">
      {{ roleLabel[staff.role] }}
    </el-tag>

    <el-icon class="staff-arrow" v-if="withPress"><ArrowRight /></el-icon>
  </div>
</template>

<style scoped lang="scss">
.staff-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.staff-item:last-child {
  border-bottom: none;
}
.staff-item--pressable {
  cursor: pointer;
  border-radius: var(--radius-md);
  padding-left: var(--spacing-sm);
  padding-right: var(--spacing-sm);
  transition: background 0.15s ease;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &:active {
    background: var(--el-fill-color);
  }
}
.staff-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-base);
  font-weight: var(--fw-bold);
  flex-shrink: 0;
}
.staff-info {
  flex: 1;
}
.staff-name {
  font-size: var(--fs-md);
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}
.staff-email {
  font-size: var(--fs-sm);
  color: var(--el-text-color-placeholder);
}
</style>
