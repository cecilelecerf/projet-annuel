<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { api } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()

interface Clinic {
  id: string
  name: string
  address: string
  phone: string
  website: string
  description?: string
  openingHours?: string
}

const clinic = ref<Clinic | null>(null)
const form = reactive({ address: '', openingHours: '' })
const loading = ref(false)

async function loadClinic() {
  try {
    const data: Clinic = await api('/clinics/me')
    clinic.value = data
    form.address = data.address ?? ''
    form.openingHours = data.openingHours ?? ''
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger la clinique')
  }
}

async function save() {
  loading.value = true
  try {
    const updated: Clinic = await api('/referent/clinic', {
      method: 'PATCH',
      body: JSON.stringify(form),
    })
    clinic.value = updated
    notify.success('Clinique mise à jour avec succès')
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
  } finally {
    loading.value = false
  }
}

onMounted(loadClinic)
</script>

<template>
  <div class="clinic-page">
    <div class="page-header">
      <h1>Ma clinique</h1>
      <p v-if="clinic">{{ clinic.name }}</p>
    </div>

    <div class="form-card">
      <h2>Modifier les informations</h2>
      <el-form label-position="top" @submit.prevent="save">
        <el-form-item label="Adresse">
          <el-input v-model="form.address" placeholder="12 rue de la Paix, 75001 Paris" />
        </el-form-item>
        <el-form-item label="Horaires d'ouverture">
          <el-input
            v-model="form.openingHours"
            type="textarea"
            :rows="4"
            placeholder="Lundi - Vendredi : 9h00 - 19h00&#10;Samedi : 9h00 - 13h00&#10;Dimanche : Fermé"
          />
        </el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading">
          Enregistrer
        </el-button>
      </el-form>
    </div>

    <div v-if="clinic" class="info-card">
      <h2>Informations actuelles</h2>
      <p><strong>Adresse :</strong> {{ clinic.address }}</p>
      <p v-if="clinic.openingHours">
        <strong>Horaires :</strong><br />
        <span style="white-space: pre-line">{{ clinic.openingHours }}</span>
      </p>
      <p v-else style="color:#6b7280">Aucun horaire renseigné</p>
    </div>
  </div>
</template>

<style scoped>
.clinic-page { max-width: 640px; margin: 0 auto; padding: 32px 24px; }
.page-header { margin-bottom: 32px; }
.page-header h1 { font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0 0 4px; }
.page-header p { color: #6b7280; margin: 0; font-size: 14px; }
.form-card, .info-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  padding: 24px;
  margin-bottom: 24px;
}
.form-card h2, .info-card h2 { font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 0 0 20px; }
.info-card p { margin: 0 0 12px; font-size: 14px; line-height: 1.6; }
</style>
