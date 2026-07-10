<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useNotify } from '@/composables/useNotify'
import { roleHomeMap } from '@/router/index'
import DevLoginSection from '../components/DevLoginSection.vue'

const notify = useNotify()

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const code = ref('')
const loading = ref(false)
const step = ref<'credentials' | 'code'>('credentials')

function goToHome() {
  const role = authStore.user?.role
  router.push(role && roleHomeMap[role] ? roleHomeMap[role] : '/')
}

async function handleLogin() {
  loading.value = true
  try {
    const result = await authStore.login(email.value, password.value)
    if (result.twoFactorRequired) {
      step.value = 'code'
      notify.info('Un code de vérification vous a été envoyé par email')
    } else {
      notify.success('Connexion réussie !')
      goToHome()
    }
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur de connexion')
  } finally {
    loading.value = false
  }
}

async function handleVerify() {
  loading.value = true
  try {
    await authStore.verifyTwoFactor(email.value, code.value)
    notify.success('Connexion réussie !')
    goToHome()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Code invalide')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <template v-if="step === 'credentials'">
        <h1 class="auth-title">Connexion</h1>

        <el-form @submit.prevent="handleLogin" label-position="top">
          <el-form-item label="Email">
            <el-input
              v-model="email"
              type="email"
              placeholder="votre@email.fr"
              autocomplete="email"
              size="large"
            />
          </el-form-item>

          <el-form-item label="Mot de passe">
            <el-input
              v-model="password"
              type="password"
              placeholder="••••••••"
              show-password
              autocomplete="current-password"
              size="large"
            />
          </el-form-item>

          <p class="forgot-password-link">
            <router-link to="/forgot-password">Mot de passe oublié ?</router-link>
          </p>

          <el-button
            type="primary"
            native-type="submit"
            size="large"
            :loading="loading"
            style="width: 100%"
          >
            Se connecter
          </el-button>
        </el-form>

        <p class="auth-footer">
          Pas encore de compte ?
          <router-link to="/register">S'inscrire</router-link>
        </p>
      </template>

      <template v-else>
        <h1 class="auth-title">Vérification en deux étapes</h1>
        <p class="auth-subtitle">
          Un code vous a été envoyé à <strong>{{ email }}</strong
          >.
        </p>

        <el-form @submit.prevent="handleVerify" label-position="top">
          <el-form-item label="Code reçu par email">
            <el-input v-model="code" placeholder="123456" maxlength="6" size="large" />
          </el-form-item>

          <el-button
            type="primary"
            native-type="submit"
            size="large"
            :loading="loading"
            style="width: 100%"
          >
            Vérifier
          </el-button>
        </el-form>

        <p class="auth-footer">
          <a href="#" @click.prevent="step = 'credentials'">Retour</a>
        </p>
      </template>
    </div>
    <dev-login-section v-if="step === 'credentials'" />
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
  margin-bottom: 28px;
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

.forgot-password-link {
  text-align: right;
  margin: -8px 0 16px;
  font-size: 13px;
}

.forgot-password-link a {
  color: #409eff;
  text-decoration: none;
}
</style>
