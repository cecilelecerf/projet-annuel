<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { http } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()

const router = useRouter()
const authStore = useAuthStore()

const visible = ref(false)
const step = ref<'confirm' | 'otp'>('confirm')
const otp = ref('')
const loading = ref(false)
const errorMsg = ref('')

function open() {
  visible.value = true
  step.value = 'confirm'
  otp.value = ''
  errorMsg.value = ''
}

async function requestOtp() {
  loading.value = true
  errorMsg.value = ''
  try {
    await http.post('/auth/delete-account/request', {})
    step.value = 'otp'
    notify.info('Un code vous a été envoyé par email')
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Erreur'
  } finally {
    loading.value = false
  }
}

async function confirmDelete() {
  if (otp.value.length !== 6) {
    errorMsg.value = 'Le code doit contenir 6 chiffres'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    await api('/auth/delete-account', {
      method: 'DELETE',
      body: JSON.stringify({ code: otp.value }),
    })
    authStore.logout().catch(() => {})
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    notify.success('Votre compte a été supprimé')
    router.push('/')
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Code invalide ou expiré'
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog
    v-model="visible"
    title="Supprimer mon compte"
    width="420px"
    :close-on-click-modal="false"
  >
    <template v-if="step === 'confirm'">
      <el-alert
        title="Cette action est irréversible. Toutes vos données seront définitivement supprimées."
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 16px"
      />
      <p>Un code de confirmation vous sera envoyé par email.</p>

      <el-alert
        v-if="errorMsg"
        :title="errorMsg"
        type="error"
        show-icon
        :closable="false"
        style="margin-top: 12px"
      />
    </template>

    <template v-else>
      <p style="margin-bottom: 12px">Entrez le code à 6 chiffres reçu par email :</p>
      <el-input
        v-model="otp"
        placeholder="123456"
        maxlength="6"
        size="large"
        style="letter-spacing: 8px; font-size: 20px; text-align: center"
      />
      <el-alert
        v-if="errorMsg"
        :title="errorMsg"
        type="error"
        show-icon
        :closable="false"
        style="margin-top: 12px"
      />
    </template>

    <template #footer>
      <el-button @click="visible = false">Annuler</el-button>
      <el-button v-if="step === 'confirm'" type="danger" :loading="loading" @click="requestOtp">
        Recevoir le code de confirmation
      </el-button>
      <el-button v-else type="danger" :loading="loading" @click="confirmDelete">
        Supprimer définitivement mon compte
      </el-button>
    </template>
  </el-dialog>
</template>
