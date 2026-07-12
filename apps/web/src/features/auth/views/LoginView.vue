<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useNotify } from '@/composables/useNotify'
import DevLoginSection from '../components/DevLoginSection.vue'

const notify = useNotify()

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    notify.success('Connexion réussie !')
    const role = authStore.user?.role
    router.push({ name: role?.toUpperCase() })
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur de connexion')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
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
    </div>
    <dev-login-section />
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
