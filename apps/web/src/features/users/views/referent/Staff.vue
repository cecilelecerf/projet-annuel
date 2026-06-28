<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { http } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()

interface StaffMember {
  id: string
  firstname: string
  lastname: string
  email: string
  role: 'VETERINARIAN' | 'SECRETARY'
  licenseNumber?: string
}

interface StaffList {
  director: StaffMember | null
  referents: StaffMember[]
  veterinarians: StaffMember[]
  secretaries: StaffMember[]
}

const staff = ref<StaffList>({ director: null, referents: [], veterinarians: [], secretaries: [] })

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
    staff.value = await http.get('/referent/staff')
  } catch {
    /* silencieux */
  }
}

onMounted(loadStaff)

const activeTab = ref<'veterinarian' | 'secretary'>('veterinarian')

const vetForm = reactive({
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  licenseNumber: '',
  bio: '',
})
const secretaryForm = reactive({ firstname: '', lastname: '', email: '', password: '' })

const loadingVet = ref(false)
const loadingSecretary = ref(false)

async function submitVet() {
  loadingVet.value = true
  try {
    await http.post('/referent/staff/veterinarians', JSON.stringify(vetForm))
    notify.success('Compte vétérinaire créé avec succès')
    Object.assign(vetForm, {
      firstname: '',
      lastname: '',
      email: '',
      password: '',
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
    await http.post('/referent/staff/secretaries', JSON.stringify(secretaryForm))
    notify.success('Compte secrétaire créé avec succès')
    Object.assign(secretaryForm, { firstname: '', lastname: '', email: '', password: '' })
    await loadStaff()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la création')
  } finally {
    loadingSecretary.value = false
  }
}
</script>

<template>
  <div class="staff-page">
    <div class="page-header">
      <h1>Gestion du personnel</h1>
      <p>Créez des comptes pour les membres de votre clinique</p>
    </div>

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
        >
          <div class="staff-avatar">{{ member.firstname[0] }}{{ member.lastname[0] }}</div>
          <div class="staff-info">
            <div class="staff-name">{{ member.firstname }} {{ member.lastname }}</div>
            <div class="staff-email">{{ member.email }}</div>
          </div>
          <el-tag :type="roleTag[member.role] as any" size="small">{{
            roleLabel[member.role]
          }}</el-tag>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="staff-tabs">
      <el-tab-pane label="Vétérinaire" name="veterinarian">
        <div class="form-card">
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
            <el-form-item label="Mot de passe provisoire">
              <el-input
                v-model="vetForm.password"
                type="password"
                show-password
                placeholder="Minimum 8 caractères"
              />
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
            <el-button type="primary" native-type="submit" :loading="loadingVet">
              Créer le compte vétérinaire
            </el-button>
          </el-form>
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
            <el-form-item label="Mot de passe provisoire">
              <el-input
                v-model="secretaryForm.password"
                type="password"
                show-password
                placeholder="Minimum 8 caractères"
              />
            </el-form-item>
            <el-button type="primary" native-type="submit" :loading="loadingSecretary">
              Créer le compte secrétaire
            </el-button>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.staff-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 24px;
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
