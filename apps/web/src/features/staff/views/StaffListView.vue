<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { staffApi, type StaffList } from '@/features/staff/api/staff.api'

const router = useRouter()

const staff = ref<StaffList>({ director: null, referents: [], veterinarians: [], secretaries: [] })
const loading = ref(false)

const roleLabel: Record<string, string> = {
  DIRECTOR: 'Directeur',
  REFERENT: 'Référent',
  VETERINARIAN: 'Vétérinaire',
  SECRETARY: 'Secrétaire',
}

const roleTag: Record<string, string> = {
  DIRECTOR: 'danger',
  REFERENT: '',
  VETERINARIAN: 'success',
  SECRETARY: 'warning',
}

async function loadStaff() {
  loading.value = true
  try {
    staff.value = await staffApi.getAll()
  } catch {
    /* silencieux */
  } finally {
    loading.value = false
  }
}

onMounted(loadStaff)

function goToDetail(id: string) {
  router.push({ name: 'REFERENT.Staff.Detail', params: { id } })
}

function goToCreate() {
  router.push({ name: 'REFERENT.Staff.Create' })
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

    <div class="staff-list-card" v-loading="loading">
      <h2 class="list-title">Personnel de la clinique</h2>
      <div
        v-if="
          !staff.director &&
          staff.referents.length === 0 &&
          staff.veterinarians.length === 0 &&
          staff.secretaries.length === 0
        "
        class="list-empty"
      >
        Aucun compte créé pour le moment.
      </div>
      <div v-else class="staff-list">
        <div
          v-for="member in [
            ...(staff.director ? [staff.director] : []),
            ...staff.referents,
            ...staff.veterinarians,
            ...staff.secretaries,
          ]"
          :key="member.id"
          class="staff-item"
          @click="goToDetail(member.id)"
        >
          <div class="staff-avatar">{{ member.firstname[0] }}{{ member.lastname[0] }}</div>
          <div class="staff-info">
            <div class="staff-name">{{ member.firstname }} {{ member.lastname }}</div>
            <div class="staff-email">{{ member.email }}</div>
          </div>
          <el-tag :type="roleTag[member.role] as any" size="small">{{
            roleLabel[member.role]
          }}</el-tag>
          <el-icon class="staff-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.staff-page {
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 6px;
}
.page-header p {
  color: #6b7280;
  margin: 0;
}
.staff-list-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 20px 24px;
}
.list-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
  color: #1a1a1a;
}
.list-empty {
  color: #9ca3af;
  font-size: 14px;
  text-align: center;
  padding: 12px 0;
}
.staff-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.staff-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s ease;
}
.staff-item:hover {
  background: #f9fafb;
}
.staff-item:last-child {
  border-bottom: none;
}
.staff-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}
.staff-info {
  flex: 1;
}
.staff-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}
.staff-email {
  font-size: 12px;
  color: #9ca3af;
}
.staff-arrow {
  color: #d1d5db;
}
</style>