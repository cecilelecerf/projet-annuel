<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { http } from '@/lib/api'
import DeleteAccountDialog from '@/components/profile/DeleteAccountDialog.vue'

const authStore = useAuthStore()
const router = useRouter()
const deleteDialog = ref<InstanceType<typeof DeleteAccountDialog> | null>(null)
const user = authStore.user

interface ClinicData {
  name: string
  address: string
  phone: string
  website: string
  description?: string | null
  openingHours?: string | null
}
interface StaffMember {
  id: string
  firstname: string
  lastname: string
  email: string
  role: string
}
interface StaffList {
  director: StaffMember | null
  referents: StaffMember[]
  veterinarians: StaffMember[]
  secretaries: StaffMember[]
}

const clinic = ref<ClinicData | null>(null)
const staff = ref<StaffList | null>(null)

const roleLabel: Record<string, string> = {
  DIRECTOR: 'Directeur',
  REFERANT: 'Référent',
  VETERINARIAN: 'Vétérinaire',
  SECRETARY: 'Secrétaire',
}
const roleTag: Record<string, string> = {
  DIRECTOR: 'danger',
  REFERANT: '',
  VETERINARIAN: 'success',
  SECRETARY: 'warning',
}

onMounted(async () => {
  const [clinicData, staffData] = await Promise.allSettled([
    http.get('/clinics/me'),
    http.get('/clinics/staff'),
  ])
  if (clinicData.status === 'fulfilled') clinic.value = clinicData.value
  if (staffData.status === 'fulfilled') staff.value = staffData.value
})

async function handleLogout() {
  await authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="profil-page">
    <div class="profil-card">
      <div class="profil-header">
        <div class="profil-avatar vet">{{ user?.firstname?.[0] }}{{ user?.lastname?.[0] }}</div>
        <div>
          <h1 class="profil-name">Dr. {{ user?.firstname }} {{ user?.lastname }}</h1>
          <span class="profil-role">Vétérinaire</span>
        </div>
      </div>

      <el-divider />

      <div class="profil-info">
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">{{ user?.email }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Prénom</span>
          <span class="info-value">{{ user?.firstname }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nom</span>
          <span class="info-value">{{ user?.lastname }}</span>
        </div>
      </div>

      <el-divider />

      <div class="profil-actions">
        <el-button size="large" @click="handleLogout">Se déconnecter</el-button>
        <el-button type="danger" size="large" plain @click="deleteDialog?.open()">
          Supprimer mon compte
        </el-button>
      </div>
    </div>
    <DeleteAccountDialog ref="deleteDialog" />

    <!-- Infos clinique (lecture seule) -->
    <div v-if="clinic" class="profil-card" style="margin-top: 24px">
      <h2 class="section-title">Ma clinique</h2>
      <div class="profil-info">
        <div class="info-row">
          <span class="info-label">Nom</span><span class="info-value">{{ clinic.name }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Adresse</span
          ><span class="info-value">{{ clinic.address }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Téléphone</span
          ><span class="info-value">{{ clinic.phone }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Site web</span>
          <span class="info-value"
            ><a :href="clinic.website" target="_blank">{{ clinic.website }}</a></span
          >
        </div>
        <div v-if="clinic.description" class="info-row">
          <span class="info-label">Description</span
          ><span class="info-value">{{ clinic.description }}</span>
        </div>
        <div v-if="clinic.openingHours" class="info-row">
          <span class="info-label">Horaires</span>
          <span class="info-value" style="white-space: pre-line">{{ clinic.openingHours }}</span>
        </div>
      </div>
    </div>

    <!-- Équipe de la clinique -->
    <div v-if="staff" class="profil-card" style="margin-top: 24px">
      <h2 class="section-title">Mon équipe</h2>
      <div class="staff-list">
        <div
          v-for="member in [
            ...(staff.director ? [staff.director] : []),
            ...staff.referents,
            ...staff.veterinarians,
            ...staff.secretaries,
          ]"
          :key="member.id"
          class="staff-item"
        >
          <div class="staff-avatar">{{ member.firstname[0] }}{{ member.lastname[0] }}</div>
          <div class="staff-info">
            <div class="staff-name">{{ member.firstname }} {{ member.lastname }}</div>
            <div class="staff-email">{{ member.email }}</div>
          </div>
          <el-tag :type="roleTag[member.role] as any" size="small">
            {{ roleLabel[member.role] }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profil-page {
  padding: 32px;
  max-width: 600px;
  margin: auto;
}
.profil-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.profil-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 8px;
}
.profil-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  flex-shrink: 0;
  background: #67c23a;
}
.profil-name {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px;
}
.profil-role {
  background: #f0f9eb;
  color: #67c23a;
  border-radius: 6px;
  padding: 2px 10px;
  font-size: 13px;
  font-weight: 500;
}
.profil-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.info-label {
  color: #888;
  font-size: 14px;
}
.info-value {
  font-weight: 500;
  color: #1a1a1a;
}
.profil-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
}
.staff-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.staff-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
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
</style>
