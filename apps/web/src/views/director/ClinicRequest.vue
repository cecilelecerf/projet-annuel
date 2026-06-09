<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { api } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()

interface ClinicRequest {
  id: string
  name: string
  address: string
  siret: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

const form = reactive({
  name: '',
  address: '',
  siret: '',
  phone: '',
  website: '',
  description: '',
})

const loading = ref(false)
const requests = ref<ClinicRequest[]>([])

const statusLabel: Record<string, { label: string; type: 'warning' | 'success' | 'danger' }> = {
  PENDING:  { label: 'En attente',  type: 'warning' },
  APPROVED: { label: 'Approuvée',   type: 'success' },
  REJECTED: { label: 'Refusée',     type: 'danger'  },
}

async function loadRequests() {
  try {
    requests.value = await api('/director/clinics/requests')
  } catch {
    // silencieux si vide
  }
}

async function submit() {
  loading.value = true
  try {
    await api('/director/clinics/request', { method: 'POST', body: JSON.stringify(form) })
    notify.success('Demande envoyée, en attente de validation par un administrateur')
    Object.assign(form, { name: '', address: '', siret: '', phone: '', website: '', description: '' })
    await loadRequests()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de l\'envoi')
  } finally {
    loading.value = false
  }
}

onMounted(loadRequests)
</script>

<template>
  <div class="clinic-request-page">
    <div class="page-header">
      <h1>Demande de création de clinique</h1>
      <p>Votre première clinique a été créée à l'inscription. Pour en ouvrir une nouvelle, soumettez une demande ci-dessous.</p>
    </div>

    <div class="form-card">
      <h2>Nouvelle demande</h2>
      <el-form label-position="top" @submit.prevent="submit">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Nom de la clinique">
              <el-input v-model="form.name" placeholder="Clinique Vétérinaire du Centre" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="SIRET (14 chiffres)">
              <el-input v-model="form.siret" placeholder="12345678901234" maxlength="14" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Adresse">
          <el-input v-model="form.address" placeholder="12 rue de la Paix, 75001 Paris" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Téléphone">
              <el-input v-model="form.phone" placeholder="0123456789" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Site web">
              <el-input v-model="form.website" placeholder="https://ma-clinique.fr" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Description (optionnel)">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="Description de la clinique..." />
        </el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading">
          Envoyer la demande
        </el-button>
      </el-form>
    </div>

    <div v-if="requests.length" class="requests-section">
      <h2>Mes demandes</h2>
      <el-table :data="requests" stripe>
        <el-table-column prop="name" label="Clinique" />
        <el-table-column prop="address" label="Adresse" />
        <el-table-column prop="siret" label="SIRET" width="160" />
        <el-table-column label="Statut" width="130">
          <template #default="{ row }">
            <el-tag :type="statusLabel[row.status].type">
              {{ statusLabel[row.status].label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Date" width="120">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleDateString('fr-FR') }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.clinic-request-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px;
}
.page-header { margin-bottom: 32px; }
.page-header h1 { font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px; }
.page-header p { color: #6b7280; margin: 0; font-size: 14px; }
.form-card { background: white; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); padding: 24px; margin-bottom: 32px; }
.form-card h2 { font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 0 0 24px; }
.requests-section h2 { font-size: 18px; font-weight: 600; margin: 0 0 16px; }
</style>
