<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { http } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()

type Status = 'loading' | 'NONE' | 'PENDING' | 'REJECTED' | 'APPROVED'

interface ClinicData {
  id: string
  name: string
  address: string
  siret: string
  phone: string
  website: string
  description?: string | null
  openingHours?: string | null
}

interface RequestData {
  id: string
  name: string
  address: string
  siret: string
  status: string
  createdAt: string
}

const status = ref<Status>('loading')
const clinic = ref<ClinicData | null>(null)
const request = ref<RequestData | null>(null)

const editMode = ref(false)
const editClinic = ref<Partial<ClinicData>>({})
const saving = ref(false)

const form = reactive({
  name: '',
  address: '',
  siret: '',
  phone: '',
  website: '',
  description: '',
})
const submitting = ref(false)

onMounted(async () => {
  try {
    const data = await http.get('/director/clinic')
    status.value = data.status
    if (data.clinic) clinic.value = data.clinic
    if (data.request) request.value = data.request
  } catch {
    notify.error('Erreur lors du chargement')
    status.value = 'NONE'
  }
})

function startEdit() {
  editClinic.value = { ...clinic.value }
  editMode.value = true
}

async function saveClinic() {
  saving.value = true
  try {
    clinic.value = await http.patch('/clinics/me', editClinic.value)
    editMode.value = false
    notify.success('Clinique mise à jour')
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur')
  } finally {
    saving.value = false
  }
}

async function submitRequest() {
  if (!form.name.trim()) return notify.error('Le nom est requis')
  if (!form.address.trim()) return notify.error("L'adresse est requise")
  if (form.siret.replace(/\s/g, '').length !== 14)
    return notify.error('Le SIRET doit contenir 14 chiffres')
  if (form.phone.replace(/\s/g, '').length < 10) return notify.error('Téléphone invalide')
  if (!form.website.trim()) return notify.error('Le site web est requis')

  submitting.value = true
  try {
    await http.post('/director/clinics/request', {
      ...form,
      siret: form.siret.replace(/\s/g, ''),
      phone: form.phone.replace(/\s/g, ''),
      description: form.description || undefined,
    })
    notify.success('Demande envoyée, en attente de validation')
    const data = await http.get('/director/clinic')
    status.value = data.status
    if (data.request) request.value = data.request
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="clinic-page">
    <!-- Chargement -->
    <div v-if="status === 'loading'" class="card">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- En attente -->
    <div v-else-if="status === 'PENDING'" class="card">
      <div class="state-icon pending">⏳</div>
      <h2 class="state-title">Demande en cours de validation</h2>
      <p class="state-desc">
        Votre demande a été transmise à un administrateur. Vous serez notifié dès qu'elle sera
        traitée. Une fois approuvée, vous pourrez gérer votre clinique et créer des comptes pour
        votre personnel.
      </p>
      <div v-if="request" class="request-summary">
        <div class="info-row">
          <span class="info-label">Clinique</span><span class="info-value">{{ request.name }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Adresse</span
          ><span class="info-value">{{ request.address }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">SIRET</span><span class="info-value">{{ request.siret }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Demande envoyée le</span>
          <span class="info-value">{{
            new Date(request.createdAt).toLocaleDateString('fr-FR')
          }}</span>
        </div>
      </div>
    </div>

    <!-- Refusée ou sans clinique → formulaire de nouvelle demande -->
    <div v-else-if="status === 'REJECTED' || status === 'NONE'">
      <div v-if="status === 'REJECTED'" class="card rejection-banner">
        <div class="state-icon rejected">✗</div>
        <h2 class="state-title">Demande refusée</h2>
        <p class="state-desc">
          Votre précédente demande a été refusée. Vous pouvez soumettre une nouvelle demande
          ci-dessous.
        </p>
        <div v-if="request" class="request-summary">
          <div class="info-row">
            <span class="info-label">Clinique refusée</span
            ><span class="info-value">{{ request.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">SIRET</span><span class="info-value">{{ request.siret }}</span>
          </div>
        </div>
      </div>
      <div v-else class="card">
        <div class="state-icon none">🏥</div>
        <h2 class="state-title">Aucune clinique associée</h2>
        <p class="state-desc">
          Vous n'êtes rattaché à aucune clinique pour le moment. Vous pouvez faire une demande de
          création de clinique ci-dessous.
        </p>
      </div>
      <div class="card" style="margin-top: 20px">
        <h2 class="section-title">
          {{ status === 'REJECTED' ? 'Nouvelle demande' : 'Demande de création de clinique' }}
        </h2>
        <el-form label-position="top" @submit.prevent="submitRequest">
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
            <el-input v-model="form.description" type="textarea" :rows="3" />
          </el-form-item>
          <el-button type="primary" native-type="submit" :loading="submitting">
            Envoyer la demande
          </el-button>
        </el-form>
      </div>
    </div>

    <!-- Approuvée → infos + édition -->
    <div v-else-if="status === 'APPROVED' && clinic" class="card">
      <div class="section-header">
        <h2 class="section-title">Ma clinique</h2>
        <el-button v-if="!editMode" size="small" @click="startEdit">Modifier</el-button>
      </div>

      <template v-if="!editMode">
        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">Nom</span><span class="info-value">{{ clinic.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Adresse</span
            ><span class="info-value">{{ clinic.address }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">SIRET</span><span class="info-value">{{ clinic.siret }}</span>
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
      </template>

      <template v-else>
        <el-form label-position="top">
          <el-form-item label="Nom"><el-input v-model="editClinic.name" /></el-form-item>
          <el-form-item label="Adresse"><el-input v-model="editClinic.address" /></el-form-item>
          <el-form-item label="Téléphone"><el-input v-model="editClinic.phone" /></el-form-item>
          <el-form-item label="Site web"><el-input v-model="editClinic.website" /></el-form-item>
          <el-form-item label="Description">
            <el-input v-model="editClinic.description" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="Horaires d'ouverture">
            <el-input
              v-model="editClinic.openingHours"
              type="textarea"
              :rows="4"
              placeholder="Ex: Lun-Ven: 9h-19h&#10;Sam: 9h-13h&#10;Dim: Fermé"
            />
          </el-form-item>
          <div style="display: flex; gap: 12px">
            <el-button @click="editMode = false">Annuler</el-button>
            <el-button type="primary" :loading="saving" @click="saveClinic">Enregistrer</el-button>
          </div>
        </el-form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.clinic-page {
}
.card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.rejection-banner {
  border-left: 4px solid #f56c6c;
}
.state-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}
.state-title {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  margin: 0 0 8px;
}
.state-desc {
  color: #666;
  text-align: center;
  margin: 0 0 24px;
  line-height: 1.6;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
}
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.request-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
