<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()
const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const loading = ref(false)
const sent = ref(false)

async function handleSubmit() {
  if (!email.value.includes('@')) {
    notify.error('Email invalide')
    return
  }

  loading.value = true
  try {
    await authStore.forgotPassword(email.value)
    sent.value = true
    notify.success('Si un compte existe, un email a été envoyé')
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la demande')
  } finally {
    loading.value = false
  }
}

function goToReset() {
  router.push({ path: '/reset-password', query: { email: email.value } })
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">Mot de passe oublié</h1>

      <template v-if="!sent">
        <p class="auth-subtitle">
          Indiquez votre email, nous vous enverrons un code pour réinitialiser votre mot de
          passe.
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

          <el-button
            type="primary"
            native-type="submit"
            size="large"
            :loading="loading"
            style="width: 100%"
          >
            Envoyer le code
          </el-button>
        </el-form>
      </template>

      <template v-else>
        <p class="auth-subtitle">
          Si un compte existe pour <strong>{{ email }}</strong
          >, un code vous a été envoyé par email.
        </p>

        <el-button type="primary" size="large" style="width: 100%" @click="goToReset">
          J'ai reçu mon code
        </el-button>
      </template>

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
