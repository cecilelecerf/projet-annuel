<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessageBox } from 'element-plus'
import { useNotify } from '@/composables/useNotify'
import { http } from '@/lib/api'
import type { Clinic } from '@armali/schemas'
import { clinicApi } from '../clinic.api'
import { useAuthStore } from '@/stores/authStore'

const notify = useNotify()

// storeToRefs est indispensable ici : déstructurer un store Pinia directement
// (`const { status } = useStore()`) casse la réactivité — on ne récupère
// qu'un instantané figé au moment du montage, jamais les mises à jour
// ultérieures (ex: fetchStatus() qui résout après coup).
const { user } = storeToRefs(useAuthStore())

type DirectorPageStatus = 'loading' | 'NONE' | 'PENDING' | 'REJECTED' | 'APPROVED'

// Statut propre à cette page, indépendant du cache du guard router.
// Cette vue EST la source de vérité affichée à l'utilisateur : elle doit
// toujours refléter l'état réel, pas une valeur potentiellement obsolète.
const directorStatus = ref<DirectorPageStatus>('loading')
const staffLoading = ref(false)

const clinic = ref<Clinic | null>(null)
const request = ref<Clinic | null>(null)

// ── Formulaire de demande de création (statut NONE / REJECTED) ─────────

const requestForm = reactive({
  name: '',
  address: '',
  siret: '',
  phone: '',
  website: '',
  description: '',
})
const submittingRequest = ref(false)

async function loadStatus() {
  if (user.value?.role === 'DIRECTOR') {
    directorStatus.value = 'loading'
    try {
      const data = await clinicApi.request.status()

      if (data.status === 'APPROVED' && data.clinic) {
        clinic.value = data.clinic
        populateFormFromClinic()
        directorStatus.value = 'APPROVED'
      } else if (data.status === 'PENDING' || data.status === 'REJECTED') {
        request.value = data.request ?? null
        directorStatus.value = data.status
      } else {
        directorStatus.value = 'NONE'
      }
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Erreur lors du chargement')
      directorStatus.value = 'NONE'
    }
  } else {
    staffLoading.value = true
    try {
      const data = await clinicApi.getMine()
      if (data[0]) {
        clinic.value = data[0]
        populateFormFromClinic()
      } else {
        throw new Error('not fetch clinic')
      }
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      staffLoading.value = false
    }
  }
}

async function submitRequest() {
  if (!requestForm.name.trim()) return notify.error('Le nom est requis')
  if (!requestForm.address.trim()) return notify.error("L'adresse est requise")
  if (requestForm.siret.replace(/\s/g, '').length !== 14)
    return notify.error('Le SIRET doit contenir 14 chiffres')
  if (requestForm.phone.replace(/\s/g, '').length < 10) return notify.error('Téléphone invalide')
  if (!requestForm.website.trim()) return notify.error('Le site web est requis')

  submittingRequest.value = true
  try {
    await http.post('/director/clinics/request', {
      ...requestForm,
      siret: requestForm.siret.replace(/\s/g, ''),
      phone: requestForm.phone.replace(/\s/g, ''),
      description: requestForm.description || undefined,
    })
    notify.success('Demande envoyée, en attente de validation')
    await loadStatus()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur')
  } finally {
    submittingRequest.value = false
  }
}

// ── Vue lecture / édition de la clinique (statut APPROVED) ─────────────

const editMode = ref(false)
const saving = ref(false)

const form = reactive({
  name: '',
  address: '',
  phone: '',
  website: '',
  description: '',
  openingHours: '',
})

function populateFormFromClinic() {
  if (!clinic.value) return
  form.name = clinic.value.name ?? ''
  form.address = clinic.value.address ?? ''
  form.phone = clinic.value.phone ?? ''
  form.website = clinic.value.website ?? ''
  form.description = clinic.value.description ?? ''
  form.openingHours = clinic.value.openingHours ?? ''
}

function startEdit() {
  populateFormFromClinic()
  editMode.value = true
}

function cancelEdit() {
  populateFormFromClinic()
  editMode.value = false
}

async function save() {
  saving.value = true
  try {
    const updated = await clinicApi.update({
      payload: {
        name: form.name,
        address: form.address,
        phone: form.phone,
        website: form.website,
        description: form.description || undefined,
        openingHours: form.openingHours || undefined,
      },
    })
    clinic.value = updated
    notify.success('Clinique mise à jour avec succès')
    editMode.value = false
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
  } finally {
    saving.value = false
  }
}

// ── Suppression de la clinique (directeur uniquement) ───────────────────

const deleting = ref(false)

async function deleteClinic() {
  try {
    await ElMessageBox.confirm(
      'Cette action est irréversible. Voulez-vous vraiment supprimer votre clinique ?',
      'Supprimer la clinique',
      {
        confirmButtonText: 'Supprimer',
        cancelButtonText: 'Annuler',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    )
  } catch {
    // Annulé par l'utilisateur
    return
  }

  deleting.value = true
  try {
    if (!clinic.value) return
    await clinicApi.remove({ id: clinic.value?.id })
    notify.success('Clinique supprimée')
    clinic.value = null
    await loadStatus()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la suppression')
  } finally {
    deleting.value = false
  }
}

onMounted(loadStatus)
</script>

<template>
  <div class="clinic-page">
    <!-- Chargement -->
    <div
      v-if="
        (user?.role === 'DIRECTOR' && directorStatus === 'loading') ||
        (user?.role !== 'DIRECTOR' && staffLoading)
      "
      class="card"
    >
      <el-skeleton :rows="5" animated />
    </div>

    <!-- En attente -->
    <div v-else-if="user?.role === 'DIRECTOR' && directorStatus === 'PENDING'" class="card">
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
    <div
      v-else-if="
        user?.role === 'DIRECTOR' && (directorStatus === 'REJECTED' || directorStatus === 'NONE')
      "
    >
      <div v-if="directorStatus === 'REJECTED'" class="card rejection-banner">
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
          {{
            directorStatus === 'REJECTED' ? 'Nouvelle demande' : 'Demande de création de clinique'
          }}
        </h2>
        <el-form label-position="top" @submit.prevent="submitRequest">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="Nom de la clinique">
                <el-input v-model="requestForm.name" placeholder="Clinique Vétérinaire du Centre" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="SIRET (14 chiffres)">
                <el-input v-model="requestForm.siret" placeholder="12345678901234" maxlength="14" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="Adresse">
            <el-input v-model="requestForm.address" placeholder="12 rue de la Paix, 75001 Paris" />
          </el-form-item>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="Téléphone">
                <el-input v-model="requestForm.phone" placeholder="0123456789" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Site web">
                <el-input v-model="requestForm.website" placeholder="https://ma-clinique.fr" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="Description (optionnel)">
            <el-input v-model="requestForm.description" type="textarea" :rows="3" />
          </el-form-item>
          <el-button type="primary" native-type="submit" :loading="submittingRequest">
            Envoyer la demande
          </el-button>
        </el-form>
      </div>
    </div>

    <!-- Approuvée / staff → gestion de la clinique -->
    <div v-else-if="(user?.role === 'DIRECTOR' ? directorStatus === 'APPROVED' : true) && clinic">
      <div class="page-header">
        <div>
          <h1>Ma clinique</h1>
          <p>{{ clinic.name }}</p>
        </div>
        <div class="page-header__actions">
          <el-tag type="info" size="large">SIRET : {{ clinic.siret }}</el-tag>
          <el-button v-if="!editMode" type="primary" @click="startEdit">Modifier</el-button>
          <el-button
            v-if="user?.role === 'DIRECTOR'"
            type="danger"
            plain
            :loading="deleting"
            @click="deleteClinic"
          >
            Supprimer la clinique
          </el-button>
        </div>
      </div>

      <!-- Vue lecture (par défaut) -->
      <div v-if="!editMode" class="info-card">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Nom</span>
            <span class="info-value">{{ clinic.name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">SIRET</span>
            <span class="info-value">{{ clinic.siret }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Téléphone</span>
            <span class="info-value">{{ clinic.phone || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Site web</span>
            <span class="info-value">{{ clinic.website || '—' }}</span>
          </div>
          <div class="info-item info-item--wide">
            <span class="info-label">Adresse</span>
            <span class="info-value">{{ clinic.address }}</span>
          </div>
          <div class="info-item info-item--wide">
            <span class="info-label">Horaires</span>
            <span class="info-value" style="white-space: pre-line">
              {{ clinic.openingHours || 'Aucun horaire renseigné' }}
            </span>
          </div>
          <div class="info-item info-item--wide">
            <span class="info-label">Description</span>
            <span class="info-value">{{ clinic.description || 'Aucune description' }}</span>
          </div>
        </div>
      </div>

      <!-- Vue édition -->
      <div v-else>
        <div class="cards-grid">
          <div class="form-card">
            <h2>Identification</h2>
            <el-form label-position="top">
              <el-form-item label="Nom de la clinique">
                <el-input v-model="form.name" placeholder="Clinique Vétérinaire du Parc" />
              </el-form-item>
            </el-form>
          </div>

          <div class="form-card">
            <h2>Contact</h2>
            <el-form label-position="top">
              <el-form-item label="Téléphone">
                <el-input v-model="form.phone" placeholder="01 23 45 67 89" />
              </el-form-item>
              <el-form-item label="Site web">
                <el-input v-model="form.website" placeholder="https://www.maclinique.fr" />
              </el-form-item>
            </el-form>
          </div>

          <div class="form-card">
            <h2>Adresse</h2>
            <el-form label-position="top">
              <el-form-item label="Adresse">
                <el-input v-model="form.address" placeholder="12 rue de la Paix, 75001 Paris" />
              </el-form-item>
            </el-form>
          </div>

          <div class="form-card">
            <h2>Horaires d'ouverture</h2>
            <el-form label-position="top">
              <el-form-item label="Horaires">
                <el-input
                  v-model="form.openingHours"
                  type="textarea"
                  :rows="4"
                  placeholder="Lundi - Vendredi : 9h00 - 19h00&#10;Samedi : 9h00 - 13h00&#10;Dimanche : Fermé"
                />
              </el-form-item>
            </el-form>
          </div>

          <div class="form-card form-card--wide">
            <h2>Description</h2>
            <el-form label-position="top">
              <el-form-item label="Présentation de la clinique">
                <el-input
                  v-model="form.description"
                  type="textarea"
                  :rows="3"
                  placeholder="Une courte description visible par les clients (spécialités, ambiance, équipements...)"
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>
            </el-form>
          </div>
        </div>

        <div class="save-bar">
          <el-button @click="cancelEdit">Annuler</el-button>
          <el-button type="primary" :loading="saving" @click="save">
            Enregistrer les modifications
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}
.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 4px;
}
.page-header p {
  color: #6b7280;
  margin: 0;
  font-size: 14px;
}
.page-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}
.form-card--wide {
  grid-column: span 2;
}

.form-card,
.info-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 24px;
}
.info-card {
  margin-bottom: 24px;
}
.form-card h2,
.info-card h2 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 16px;
}

.save-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.info-item--wide {
  grid-column: span 2;
}
.info-label {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.info-value {
  font-size: 14px;
  color: #1a1a1a;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .cards-grid,
  .info-grid {
    grid-template-columns: 1fr;
  }
  .form-card--wide,
  .info-item--wide {
    grid-column: span 1;
  }
}
</style>
