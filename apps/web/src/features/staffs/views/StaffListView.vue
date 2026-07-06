<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Staff } from '@armali/schemas'
import { clinicApi } from '@/features/clinics/clinic.api'
import { useAuthStore } from '@/stores/authStore'
import StaffList from '../components/StaffList.vue'

const router = useRouter()

const staffs = ref<Staff[]>()
const { user } = useAuthStore()
const loading = ref(false)

async function loadStaff() {
  loading.value = true
  if (user?.clinicId)
    try {
      staffs.value = await clinicApi.staffByClinic({ clinicId: user.clinicId })
    } catch {
      /* silencieux */
    } finally {
      loading.value = false
    }
}

onMounted(loadStaff)

function goToCreate() {
  router.push({ name: `${user?.role.toUpperCase()}.Staff.Create` })
}
</script>

<template>
  <div class="staff-page">
    <div class="page-header">
      <div>
        <h1>Gestion du personnel</h1>
        <p>Consultez et créez des comptes pour les membres de votre clinique</p>
      </div>
      <el-button type="primary" @click="goToCreate">+ Ajouter un membre</el-button>
    </div>
    <!-- TODO : fetch le nom de la clinique -->
    <StaffList v-if="staffs" :staffs="staffs" clinic-name="fefe" :with-go-to-detail="true" />
  </div>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
}
.page-header h1 {
  font-size: 24px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-sm);
}
.page-header p {
  color: var(--el-text-color-secondary);
  margin: 0;
}
.staff-list-card {
  background: var(--el-bg-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-lg) var(--spacing-lg);
}
.list-title {
  font-size: var(--fs-xl);
  font-weight: var(--fw-semibold);
  margin: 0 0 var(--spacing-md);
  color: var(--el-text-color-primary);
}
.list-empty {
  color: var(--el-text-color-placeholder);
  font-size: var(--fs-md);
  text-align: center;
  padding: var(--spacing-md) 0;
}
.staff-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.staff-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background 0.15s ease;
}
.staff-item:hover {
  background: var(--el-fill-color-light);
}
.staff-item:last-child {
  border-bottom: none;
}
.staff-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--el-color-yellow-light-5);
  color: var(--el-color-yellow);
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
.staff-arrow {
  color: #d1d5db;
}
</style>
