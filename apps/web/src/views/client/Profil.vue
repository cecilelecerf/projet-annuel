<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import { api } from '@/lib/api'
import DeleteAccountDialog from '@/components/profile/DeleteAccountDialog.vue'

const authStore = useAuthStore()
const router = useRouter()
const deleteDialog = ref<InstanceType<typeof DeleteAccountDialog> | null>(null)

const user = authStore.user
const loading = ref(false)

async function handleLogout() {
  await authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="profil-page">
    <div class="profil-card">
      <div class="profil-header">
        <div class="profil-avatar">
          {{ user?.firstname?.[0] }}{{ user?.lastname?.[0] }}
        </div>
        <div>
          <h1 class="profil-name">{{ user?.firstname }} {{ user?.lastname }}</h1>
          <span class="profil-role">Propriétaire</span>
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
        <el-button size="large" @click="handleLogout" :loading="loading">
          Se déconnecter
        </el-button>
        <el-button
          type="danger"
          size="large"
          plain
          @click="deleteDialog?.open()"
        >
          Supprimer mon compte
        </el-button>
      </div>
    </div>

    <DeleteAccountDialog ref="deleteDialog" />
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
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
}

.profil-name {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px;
}

.profil-role {
  background: #ecf5ff;
  color: #409eff;
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
</style>
