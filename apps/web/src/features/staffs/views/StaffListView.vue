<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useFormErrorStore } from '@/stores/formErrorStore'
import StaffList from '../components/StaffList.vue'
import { type ClinicId, type StaffMember, type UserRole } from '@armali/schemas'
import { staffApi } from '../staff.api.ts'
import { getStaffPageTexts } from '../utils.ts'

const ROLES: UserRole[] = ['DIRECTOR', 'REFERENT', 'SECRETARY', 'VETERINARIAN']

const router = useRouter()
const route = useRoute()
const formError = useFormErrorStore()

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const role = computed<UserRole | undefined>(() => {
  if (route.name?.toString() === 'SECRETARY.Veto.List') return 'VETERINARIAN'
  const value = route.query.role
  return typeof value === 'string' && ROLES.includes(value as UserRole)
    ? (value as UserRole)
    : undefined
})
const clinicIds = computed(() => {
  if (user.value?.role === 'ADMIN' || user.value?.role === 'CLIENT') return []
  return user.value?.role === 'VETERINARIAN' ? user.value.clinicIds : [user.value?.clinicId]
})
const staffByClinic = ref<Record<ClinicId, StaffMember[]>>({})
const loading = ref(false)

async function loadStaff() {
  if (!user.value || user.value?.role === 'CLIENT' || user.value?.role === 'ADMIN') return

  loading.value = true
  formError.clear()
  try {
    if (clinicIds.value.some((c) => c === undefined)) return
    const results = await Promise.all(
      clinicIds.value.map((c) =>
        staffApi.getAllByClinic({ clinicId: c! }).then((staff) => [c, staff] as const),
      ),
    )
    staffByClinic.value = Object.fromEntries(results)
  } catch (err) {
    formError.handle(err)
  } finally {
    loading.value = false
  }
}

// Redirige si l'utilisateur n'a pas accès à cette page, sans casser le rendu
onMounted(() => {
  loadStaff()
})

watch(role, () => {
  if (user.value && ROLES.includes(user.value.role)) loadStaff()
})

const pageTexts = computed(() => getStaffPageTexts(role.value))

function goToCreate() {
  if (!user.value) return
  router.push({ name: `${user.value.role.toUpperCase()}.Staff.Create` })
}
</script>

<template>
  <div class="staff-page" v-if="clinicIds">
    <div class="page-header">
      <div>
        <h1>{{ pageTexts.title }}</h1>
        <p>{{ pageTexts.description }}</p>
      </div>
      <el-button
        type="primary"
        @click="goToCreate"
        v-if="user?.role === 'DIRECTOR' || user?.role === 'REFERENT'"
        >+ Ajouter un membre</el-button
      >
    </div>
    <!-- TODO : fetch le nom de la clinique -->
    <template v-for="id in clinicIds" :key="id">
      <StaffList v-if="id && staffByClinic[id]" clinic-name="e" :staffs="staffByClinic[id] ?? []" />
    </template>
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
