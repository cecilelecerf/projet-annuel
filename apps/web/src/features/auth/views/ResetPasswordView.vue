<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const code = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')
const loading = ref(false)

function validate(): string | null {
  if (!email.value.includes('@')) return 'Email invalide'
  if (code.value.length !== 6) return 'Le code doit contenir 6 chiffres'
  if (newPassword.value.length < 12) return 'Mot de passe : minimum 12 caractères'
  if (!/[A-Za-z]/.test(newPassword.value) || !/[0-9]/.test(newPassword.value) || !/[^A-Za-z0-9]/.test(newPassword.value))
    return 'Mot de passe : au moins une lettre, un chiffre et un symbole'
  if (newPassword.value !== newPasswordConfirm.value)
    return 'Les mots de passe ne correspondent pas'
  return null
}

async function handleSubmit() {
  const err = validate()
  if (err) {
    notify.error(err)
    return
  }

  loading.value = true
  try {
    await authStore.resetPassword(email.value, code.value, newPassword.value)
    notify.success('Mot de passe réinitialisé avec succès')
    router.push({ name: 'Login' })
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">Réinitialiser le mot de passe</h1>
      <p class="auth-subtitle">
        Saisissez le code reçu par email ainsi que votre nouveau mot de passe.
      </p>

      <el-form @submit.prevent="handleSubmit" label-position="top">
        <el-form-item label="Email">
          <el-input
            v-model="email"
            type="email"
            placeholder="votre@email.fr"
            autocomplete="email"
            size="large"
          />
        </el-form-item>

        <el-form-item label="Code reçu par email">
          <el-input v-model="code" placeholder="123456" maxlength="6" size="large" />
        </el-form-item>

        <el-form-item label="Nouveau mot de passe">
          <el-input
            v-model="newPassword"
            type="password"
            placeholder="Min. 12 caractères, avec lettres, chiffres et symboles"
            show-password
            autocomplete="new-password"
            size="large"
          />
        </el-form-item>

        <el-form-item label="Confirmer le mot de passe">
          <el-input
            v-model="newPasswordConfirm"
            type="password"
            placeholder="••••••••"
            show-password
            autocomplete="new-password"
            size="large"
          />
        </el-form-item>

        <el-button
          type="primary"
          native-type="submit"
          size="large"
          :loading="loading"
          style="width: 100%"
        >
          Réinitialiser le mot de passe
        </el-button>
      </el-form>

      <p class="auth-footer">
        <router-link to="/login">Retour à la connexion</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 440px;
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
  font-size: 14px;
  line-height: 1.5;
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
