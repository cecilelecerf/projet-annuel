<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'

const route = useRoute()
const router = useRouter()
const notify = useNotify()

interface Account {
  id: string
  email: string
  firstname: string
  lastname: string
  role: 'CLIENT' | 'SECRETARY' | 'VETERINARIAN' | 'DIRECTOR' | 'REFERANT' | 'ADMIN'
  createdAt: string
  veterinarianProfile?: { licenseNumber: string; bio?: string | null } | null
  clientProfile?: {
    dateOfBirth: string
    address?: string | null
    phone?: string | null
    country: string
  } | null
}

const roleLabel: Record<string, string> = {
  CLIENT: 'Client',
  SECRETARY: 'Secrétaire',
  VETERINARIAN: 'Vétérinaire',
  DIRECTOR: 'Directeur',
  REFERANT: 'Référent',
  ADMIN: 'Administrateur',
}

const account = ref<Account | null>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    account.value = await http.get(`/users/${route.params.id}`)
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger ce compte')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="account-detail-page">
    <button class="back-btn" @click="router.back()">← Retour</button>

    <div v-if="loading" class="card">
      <el-skeleton :rows="4" animated />
    </div>

    <div v-else-if="account" class="card">
      <div class="header">
        <div class="avatar">{{ account.firstname[0] }}{{ account.lastname[0] }}</div>
        <div>
          <h1>{{ account.firstname }} {{ account.lastname }}</h1>
          <el-tag size="small">{{ roleLabel[account.role] }}</el-tag>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">Email</span><span class="info-value">{{ account.email }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Membre depuis</span>
          <span class="info-value">{{ new Date(account.createdAt).toLocaleDateString('fr-FR') }}</span>
        </div>

        <template v-if="account.veterinarianProfile">
          <div class="info-row">
            <span class="info-label">Numéro de licence</span>
            <span class="info-value">{{ account.veterinarianProfile.licenseNumber }}</span>
          </div>
          <div v-if="account.veterinarianProfile.bio" class="info-row">
            <span class="info-label">Biographie</span>
            <span class="info-value">{{ account.veterinarianProfile.bio }}</span>
          </div>
        </template>

        <template v-if="account.clientProfile">
          <div class="info-row">
            <span class="info-label">Date de naissance</span>
            <span class="info-value">{{
              new Date(account.clientProfile.dateOfBirth).toLocaleDateString('fr-FR')
            }}</span>
          </div>
          <div v-if="account.clientProfile.address" class="info-row">
            <span class="info-label">Adresse</span>
            <span class="info-value">{{ account.clientProfile.address }}</span>
          </div>
          <div v-if="account.clientProfile.phone" class="info-row">
            <span class="info-label">Téléphone</span>
            <span class="info-value">{{ account.clientProfile.phone }}</span>
          </div>
        </template>
      </div>
    </div>

    <div v-else class="card">
      <p>Ce compte est introuvable.</p>
    </div>
  </div>
</template>

<style scoped>
.account-detail-page {
  padding: 32px 24px;
  max-width: 640px;
  margin: 0 auto;
}
.back-btn {
  background: none;
  border: none;
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  margin-bottom: 16px;
  display: block;
}
.card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}
.header h1 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 6px;
  color: #1a1a1a;
}
.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
}
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.info-label {
  color: #888;
  font-size: 14px;
  flex-shrink: 0;
  margin-right: 16px;
}
.info-value {
  font-weight: 500;
  color: #1a1a1a;
  text-align: right;
}
</style>
