<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()
const router = useRouter()

type ClinicStatus = 'loading' | 'NONE' | 'PENDING' | 'REJECTED' | 'APPROVED'
const clinicStatus = ref<ClinicStatus>('loading')

interface StaffMember {
  id: string
  firstname: string
  lastname: string
  email: string
  role: 'REFERANT' | 'VETERINARIAN' | 'SECRETARY'
  licenseNumber?: string
}

interface StaffList {
  director: StaffMember | null
  referents: StaffMember[]
  veterinarians: StaffMember[]
  secretaries: StaffMember[]
}

const staff = ref<StaffList>({ director: null, referents: [], veterinarians: [], secretaries: [] })

const DELETABLE_ROLES = ['REFERANT', 'VETERINARIAN', 'SECRETARY']

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

async function loadStaff() {
  try {
    staff.value = await http.get('/director/staff')
  } catch {
    // clinique pas encore approuvée
  }
}

function goToDetail(member: StaffMember) {
  router.push({ name: 'Director.Staff.Detail', params: { id: member.id } })
}

async function deleteMember(member: StaffMember) {
  try {
    await http.delete(`/director/staff/${member.id}`)
    notify.success('Compte supprimé')
    await loadStaff()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la suppression')
  }
}

onMounted(async () => {
  try {
    const data = await http.get('/director/clinic')
    clinicStatus.value = data.status
    if (data.status === 'APPROVED') await loadStaff()
  } catch {
    clinicStatus.value = 'NONE'
  }
})

const activeTab = ref<'referent' | 'veterinarian' | 'secretary'>('referent')

const referentForm = reactive({ firstname: '', lastname: '', email: '' })
const vetForm = reactive({
  firstname: '',
  lastname: '',
  email: '',
  licenseNumber: '',
  bio: '',
})
const secretaryForm = reactive({ firstname: '', lastname: '', email: '' })

const loadingReferent = ref(false)
const loadingVet = ref(false)
const loadingSecretary = ref(false)

async function submitReferent() {
  loadingReferent.value = true
  try {
    await http.post('/director/staff/referents', referentForm)
    notify.success('Compte référent créé, ses identifiants lui ont été envoyés par email')
    Object.assign(referentForm, { firstname: '', lastname: '', email: '' })
    await loadStaff()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la création')
  } finally {
    loadingReferent.value = false
  }
}

async function submitVet() {
  loadingVet.value = true
  try {
    await http.post('/director/staff/veterinarians', vetForm)
    notify.success('Compte vétérinaire créé, ses identifiants lui ont été envoyés par email')
    Object.assign(vetForm, {
      firstname: '',
      lastname: '',
      email: '',
      licenseNumber: '',
      bio: '',
    })
    await loadStaff()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la création')
  } finally {
    loadingVet.value = false
  }
}

async function submitSecretary() {
  loadingSecretary.value = true
  try {
    await http.post('/director/staff/secretaries', secretaryForm)
    notify.success('Compte secrétaire créé, ses identifiants lui ont été envoyés par email')
    Object.assign(secretaryForm, { firstname: '', lastname: '', email: '' })
    await loadStaff()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la création')
  } finally {
    loadingSecretary.value = false
  }
}

interface VetSearchResult {
  id: string
  firstname: string
  lastname: string
  email: string
  licenseNumber: string
}

const vetMode = ref<'create' | 'link'>('create')
const vetSearchQuery = ref('')
const vetSearchResults = ref<VetSearchResult[]>([])
const searchingVet = ref(false)
const linkingVetId = ref<string | null>(null)
const hasSearchedVet = ref(false)

async function searchVet() {
  const q = vetSearchQuery.value.trim()
  if (!q) return
  searchingVet.value = true
  hasSearchedVet.value = true
  try {
    vetSearchResults.value = await http.get(
      `/director/staff/veterinarians/search?q=${encodeURIComponent(q)}`,
    )
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la recherche')
  } finally {
    searchingVet.value = false
  }
}

async function linkVet(veterinarianId: string) {
  linkingVetId.value = veterinarianId
  try {
    await http.post('/director/staff/veterinarians/link', { veterinarianId })
    notify.success('Vétérinaire lié à la clinique avec succès')
    vetSearchResults.value = vetSearchResults.value.filter((v) => v.id !== veterinarianId)
    await loadStaff()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la liaison')
  } finally {
    linkingVetId.value = null
  }
}
</script>

<template>
  <div class="staff-page">
    <div class="page-header">
      <h1>Gestion du personnel</h1>
      <p>Créez des comptes pour les membres de votre équipe</p>
    </div>

    <!-- Guard : clinique non approuvée -->
    <div v-if="clinicStatus === 'loading'" class="gate-card">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="clinicStatus !== 'APPROVED'" class="gate-card">
      <div class="gate-icon">🔒</div>
      <h2 class="gate-title">Clinique requise</h2>
      <p v-if="clinicStatus === 'PENDING'" class="gate-desc">
        Votre demande de clinique est <strong>en attente de validation</strong>. Vous pourrez créer
        des comptes dès qu'un administrateur l'aura approuvée.
      </p>
      <p v-else class="gate-desc">
        Vous devez avoir une clinique approuvée avant de pouvoir créer des comptes pour votre
        personnel.
      </p>
      <el-button type="primary" @click="router.push({ name: 'Director.Clinic' })">
        Voir le statut de ma clinique
      </el-button>
    </div>

    <template v-else>
      <!-- Liste du personnel -->
      <div class="staff-list-card">
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
            @click="goToDetail(member)"
          >
            <div class="staff-avatar">{{ member.firstname[0] }}{{ member.lastname[0] }}</div>
            <div class="staff-info">
              <div class="staff-name">{{ member.firstname }} {{ member.lastname }}</div>
              <div class="staff-email">{{ member.email }}</div>
            </div>
            <el-tag :type="roleTag[member.role] as any" size="small">{{
              roleLabel[member.role]
            }}</el-tag>
            <el-popconfirm
              v-if="DELETABLE_ROLES.includes(member.role)"
              title="Supprimer ce compte ?"
              @confirm="deleteMember(member)"
            >
              <template #reference>
                <el-button size="small" type="danger" text @click.stop>Supprimer</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="staff-tabs">
        <el-tab-pane label="Référent clinique" name="referent">
          <div class="form-card">
            <h2>Créer un compte référent</h2>
            <el-form label-position="top" @submit.prevent="submitReferent">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="Prénom">
                    <el-input v-model="referentForm.firstname" placeholder="Prénom" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Nom">
                    <el-input v-model="referentForm.lastname" placeholder="Nom" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="Email">
                <el-input
                  v-model="referentForm.email"
                  type="email"
                  placeholder="email@exemple.com"
                />
              </el-form-item>
              <p class="form-hint">
                Un mot de passe provisoire sera généré et envoyé par email au référent.
              </p>
              <el-button type="primary" native-type="submit" :loading="loadingReferent">
                Créer le compte référent
              </el-button>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Vétérinaire" name="veterinarian">
          <div class="form-card">
            <el-radio-group v-model="vetMode" class="vet-mode-switch">
              <el-radio-button value="create">Créer un nouveau compte</el-radio-button>
              <el-radio-button value="link">Lier un vétérinaire existant</el-radio-button>
            </el-radio-group>

            <template v-if="vetMode === 'create'">
              <h2>Créer un compte vétérinaire</h2>
              <el-form label-position="top" @submit.prevent="submitVet">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="Prénom">
                      <el-input v-model="vetForm.firstname" placeholder="Prénom" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="Nom">
                      <el-input v-model="vetForm.lastname" placeholder="Nom" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="Email">
                  <el-input v-model="vetForm.email" type="email" placeholder="email@exemple.com" />
                </el-form-item>
                <el-form-item label="Numéro de licence">
                  <el-input
                    v-model="vetForm.licenseNumber"
                    placeholder="Numéro de licence vétérinaire"
                  />
                </el-form-item>
                <el-form-item label="Biographie (optionnel)">
                  <el-input
                    v-model="vetForm.bio"
                    type="textarea"
                    :rows="3"
                    placeholder="Spécialités, expériences..."
                  />
                </el-form-item>
                <p class="form-hint">
                  Un mot de passe provisoire sera généré et envoyé par email au vétérinaire.
                </p>
                <el-button type="primary" native-type="submit" :loading="loadingVet">
                  Créer le compte vétérinaire
                </el-button>
              </el-form>
            </template>

            <template v-else>
              <h2>Lier un vétérinaire existant</h2>
              <p class="form-hint">
                Recherchez un vétérinaire déjà inscrit sur Armali par son email ou son numéro de
                licence, puis liez-le à votre clinique.
              </p>
              <div class="vet-search-bar">
                <el-input
                  v-model="vetSearchQuery"
                  placeholder="Email ou numéro de licence"
                  @keyup.enter="searchVet"
                />
                <el-button type="primary" :loading="searchingVet" @click="searchVet">
                  Rechercher
                </el-button>
              </div>

              <div v-if="hasSearchedVet && !searchingVet" class="vet-search-results">
                <div v-if="vetSearchResults.length === 0" class="list-empty">
                  Aucun vétérinaire trouvé pour cette recherche.
                </div>
                <div
                  v-for="vet in vetSearchResults"
                  :key="vet.id"
                  class="staff-item"
                >
                  <div class="staff-avatar">{{ vet.firstname[0] }}{{ vet.lastname[0] }}</div>
                  <div class="staff-info">
                    <div class="staff-name">{{ vet.firstname }} {{ vet.lastname }}</div>
                    <div class="staff-email">{{ vet.email }} · Licence {{ vet.licenseNumber }}</div>
                  </div>
                  <el-button
                    size="small"
                    type="primary"
                    :loading="linkingVetId === vet.id"
                    @click="linkVet(vet.id)"
                  >
                    Lier à ma clinique
                  </el-button>
                </div>
              </div>
            </template>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Secrétaire" name="secretary">
          <div class="form-card">
            <h2>Créer un compte secrétaire</h2>
            <el-form label-position="top" @submit.prevent="submitSecretary">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="Prénom">
                    <el-input v-model="secretaryForm.firstname" placeholder="Prénom" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Nom">
                    <el-input v-model="secretaryForm.lastname" placeholder="Nom" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="Email">
                <el-input
                  v-model="secretaryForm.email"
                  type="email"
                  placeholder="email@exemple.com"
                />
              </el-form-item>
              <p class="form-hint">
                Un mot de passe provisoire sera généré et envoyé par email au secrétaire.
              </p>
              <el-button type="primary" native-type="submit" :loading="loadingSecretary">
                Créer le compte secrétaire
              </el-button>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
</template>

<style scoped>
.staff-page {
}
.page-header {
  margin-bottom: 32px;
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
.staff-tabs {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.form-card {
  padding: 24px;
}
.form-card h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 24px;
}
.form-hint {
  color: #6b7280;
  font-size: 13px;
  margin: -8px 0 16px;
  line-height: 1.5;
}
.vet-mode-switch {
  display: flex;
  margin-bottom: 24px;
}
.vet-search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.vet-search-bar .el-input {
  flex: 1;
}
.vet-search-results {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.gate-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 48px 32px;
  text-align: center;
}
.gate-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.gate-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 12px;
  color: #1a1a1a;
}
.gate-desc {
  color: #6b7280;
  margin: 0 0 24px;
  line-height: 1.6;
  max-width: 420px;
  margin-left: auto;
  margin-right: auto;
}
.staff-list-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 20px 24px;
  margin-bottom: 24px;
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
  gap: 10px;
}
.staff-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  cursor: pointer;
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
