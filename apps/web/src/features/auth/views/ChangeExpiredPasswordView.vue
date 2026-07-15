<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { http } from '@/lib/api'
import { roleHomeMap } from '@/router/index'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()
const router = useRouter()
const authStore = useAuthStore()

const currentPassword = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')
const loading = ref(false)

function validate(): string | null {
  if (!currentPassword.value) return 'Mot de passe actuel requis'
  if (newPassword.value.length < 12) return 'Mot de passe : minimum 12 caractères'
  if (
    !/[A-Za-z]/.test(newPassword.value) ||
    !/[0-9]/.test(newPassword.value) ||
    !/[^A-Za-z0-9]/.test(newPassword.value)
  )
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
    await http.patch('/auth/me', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })
    authStore.completePasswordChange()
    notify.success('Mot de passe mis à jour avec succès')
    const role = authStore.user?.role
    router.push(role && roleHomeMap[role] ? roleHomeMap[role] : '/')
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">Mot de passe expiré</h1>
      <p class="auth-subtitle">
        Pour la sécurité de votre compte, votre mot de passe doit être renouvelé tous les 60
        jours. Merci de définir un nouveau mot de passe pour continuer.
      </p>

      <el-form @submit.prevent="handleSubmit" label-position="top">
        <el-form-item label="Mot de passe actuel">
          <el-input
            v-model="currentPassword"
            type="password"
            show-password
            autocomplete="current-password"
            size="large"
          />
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
          Mettre à jour le mot de passe
        </el-button>
      </el-form>
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
</style>
