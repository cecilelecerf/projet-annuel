<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, type UserStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { roleHomeMap } from '@/router/index'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()

const router = useRouter()
const authStore = useAuthStore()

type Step = 'role' | 'user' | 'clinic'

const step = ref<Step>('role')
const selectedRole = ref<'CLIENT' | 'DIRECTOR'>('CLIENT')

const form = ref({
  email: '',
  password: '',
  passwordConfirm: '',
  firstname: '',
  lastname: '',
})

const clinic = ref({
  name: '',
  address: '',
  siret: '',
  phone: '',
  website: '',
  description: '',
})

const loading = ref(false)

function selectRole(role: 'CLIENT' | 'DIRECTOR') {
  selectedRole.value = role
  step.value = 'user'
}

function goBack() {
  if (step.value === 'clinic') step.value = 'user'
  else step.value = 'role'
}

function validateUserForm(): string | null {
  if (!form.value.firstname.trim()) return 'Le prénom est requis'
  if (!form.value.lastname.trim()) return 'Le nom est requis'
  if (!form.value.email.includes('@')) return 'Email invalide'
  if (form.value.password.length < 8) return 'Mot de passe : minimum 8 caractères'
  if (form.value.password !== form.value.passwordConfirm) return 'Les mots de passe ne correspondent pas'
  return null
}

function validateClinicForm(): string | null {
  if (!clinic.value.name.trim()) return 'Le nom de la clinique est requis'
  if (!clinic.value.address.trim()) return "L'adresse est requise"
  if (clinic.value.siret.replace(/\s/g, '').length !== 14) return 'Le SIRET doit contenir 14 chiffres'
  if (clinic.value.phone.replace(/\s/g, '').length < 10) return 'Téléphone invalide'
  if (!clinic.value.website.trim()) return 'Le site web est requis'
  return null
}

function nextToClinic() {
  const err = validateUserForm()
  if (err) { notify.error(err); return }
  step.value = 'clinic'
}

async function handleSubmit() {
  const userErr = validateUserForm()
  if (userErr) { notify.error(userErr); return }

  if (selectedRole.value === 'DIRECTOR') {
    const clinicErr = validateClinicForm()
    if (clinicErr) { notify.error(clinicErr); return }
  }

  loading.value = true
  try {
    let data: { user: Record<string, unknown>; accessToken: string; refreshToken: string }

    if (selectedRole.value === 'DIRECTOR') {
      data = await api('/auth/register-director', {
        method: 'POST',
        body: JSON.stringify({
          email: form.value.email,
          password: form.value.password,
          firstname: form.value.firstname,
          lastname: form.value.lastname,
          clinic: {
            name: clinic.value.name,
            address: clinic.value.address,
            siret: clinic.value.siret.replace(/\s/g, ''),
            phone: clinic.value.phone.replace(/\s/g, ''),
            website: clinic.value.website,
            description: clinic.value.description || undefined,
          },
        }),
      })
    } else {
      data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: form.value.email,
          password: form.value.password,
          firstname: form.value.firstname,
          lastname: form.value.lastname,
        }),
      })
    }

    authStore.setAuth(data.user as UserStore, data.accessToken, data.refreshToken)
    notify.success('Compte créé avec succès !')
    const role = authStore.user?.role
    router.push(role && roleHomeMap[role] ? roleHomeMap[role] : '/')

  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : "Erreur lors de l'inscription")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">

      <!-- ÉTAPE 1 : Choix du rôle -->
      <template v-if="step === 'role'">
        <h1 class="auth-title">Créer un compte</h1>
        <p class="auth-subtitle">Quel est votre profil ?</p>

        <div class="role-grid">
          <button class="role-card" @click="selectRole('CLIENT')">
            <span class="role-icon">🐾</span>
            <span class="role-label">Propriétaire</span>
            <span class="role-desc">Je cherche un vétérinaire pour mon animal</span>
          </button>
          <button class="role-card" @click="selectRole('DIRECTOR')">
            <span class="role-icon">🏥</span>
            <span class="role-label">Directeur de clinique</span>
            <span class="role-desc">Je gère une clinique vétérinaire</span>
          </button>
        </div>

        <p class="auth-footer">
          Déjà un compte ?
          <router-link to="/login">Se connecter</router-link>
        </p>
      </template>

      <!-- ÉTAPE 2 : Infos personnelles -->
      <template v-else-if="step === 'user'">
        <button class="back-btn" @click="goBack">← Retour</button>
        <h1 class="auth-title">Vos informations</h1>

        <el-form @submit.prevent="selectedRole === 'DIRECTOR' ? nextToClinic() : handleSubmit()" label-position="top">
          <div class="form-row">
            <el-form-item label="Prénom">
              <el-input v-model="form.firstname" placeholder="Alice" size="large" />
            </el-form-item>
            <el-form-item label="Nom">
              <el-input v-model="form.lastname" placeholder="Dupont" size="large" />
            </el-form-item>
          </div>

          <el-form-item label="Email">
            <el-input v-model="form.email" type="email" placeholder="votre@email.fr" size="large" />
          </el-form-item>

          <el-form-item label="Mot de passe">
            <el-input v-model="form.password" type="password" show-password placeholder="Minimum 8 caractères" size="large" />
          </el-form-item>

          <el-form-item label="Confirmer le mot de passe">
            <el-input v-model="form.passwordConfirm" type="password" show-password placeholder="••••••••" size="large" />
          </el-form-item>

          <el-button
            type="primary"
            native-type="submit"
            size="large"
            :loading="loading"
            style="width: 100%"
          >
            {{ selectedRole === 'DIRECTOR' ? 'Suivant : ma clinique →' : "S'inscrire" }}
          </el-button>
        </el-form>
      </template>

      <!-- ÉTAPE 3 : Infos clinique (Director uniquement) -->
      <template v-else-if="step === 'clinic'">
        <button class="back-btn" @click="goBack">← Retour</button>
        <h1 class="auth-title">Votre clinique</h1>

        <el-form @submit.prevent="handleSubmit" label-position="top">
          <el-form-item label="Nom de la clinique">
            <el-input v-model="clinic.name" placeholder="Clinique Vétérinaire du Centre" size="large" />
          </el-form-item>

          <el-form-item label="Adresse">
            <el-input v-model="clinic.address" placeholder="12 rue de la Paix, 75001 Paris" size="large" />
          </el-form-item>

          <div class="form-row">
            <el-form-item label="SIRET (14 chiffres)">
              <el-input v-model="clinic.siret" placeholder="123 456 789 01234" size="large" maxlength="17" />
            </el-form-item>
            <el-form-item label="Téléphone">
              <el-input v-model="clinic.phone" placeholder="01 02 03 04 05" size="large" />
            </el-form-item>
          </div>

          <el-form-item label="Site web">
            <el-input v-model="clinic.website" placeholder="https://ma-clinique.fr" size="large" />
          </el-form-item>

          <el-form-item label="Description (optionnelle)">
            <el-input
              v-model="clinic.description"
              type="textarea"
              placeholder="Présentez votre clinique..."
              :rows="3"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <el-button
            type="primary"
            native-type="submit"
            size="large"
            :loading="loading"
            style="width: 100%"
          >
            Créer mon compte et soumettre la demande
          </el-button>
        </el-form>
      </template>

    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 20px;
}

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.auth-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  text-align: center;
  color: #1a1a1a;
}

.auth-subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 28px;
}

.role-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.role-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.role-card:hover {
  border-color: #409eff;
  background: #f0f7ff;
}

.role-icon {
  font-size: 32px;
}

.role-label {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 14px;
}

.role-desc {
  font-size: 12px;
  color: #888;
  line-height: 1.4;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
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

.auth-footer {
  margin-top: 20px;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.auth-footer a {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
}
</style>
