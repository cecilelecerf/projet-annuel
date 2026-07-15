<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { http } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()
const authStore = useAuthStore()

const visible = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  firstname: '',
  lastname: '',
  email: '',
  currentPassword: '',
  newPassword: '',
})

function open() {
  form.firstname = authStore.user?.firstname ?? ''
  form.lastname = authStore.user?.lastname ?? ''
  form.email = authStore.user?.email ?? ''
  form.currentPassword = ''
  form.newPassword = ''
  errorMsg.value = ''
  visible.value = true
}

async function submit() {
  loading.value = true
  errorMsg.value = ''
  try {
    const payload: Record<string, string> = {
      firstname: form.firstname,
      lastname: form.lastname,
      email: form.email,
    }
    if (form.newPassword) {
      payload.currentPassword = form.currentPassword
      payload.newPassword = form.newPassword
    }

    const updated = await http.patch<{ firstname: string; lastname: string; email: string }>(
      '/auth/me',
      payload,
    )

    if (authStore.user) {
      authStore.user.firstname = updated.firstname
      authStore.user.lastname = updated.lastname
      authStore.user.email = updated.email
    }

    notify.success('Profil mis à jour')
    visible.value = false
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Erreur'
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog
    v-model="visible"
    title="Modifier mon profil"
    width="440px"
    :close-on-click-modal="false"
  >
    <el-form label-position="top">
      <el-form-item label="Prénom">
        <el-input v-model="form.firstname" />
      </el-form-item>
      <el-form-item label="Nom">
        <el-input v-model="form.lastname" />
      </el-form-item>
      <el-form-item label="Email">
        <el-input v-model="form.email" />
      </el-form-item>

      <el-divider>Changer le mot de passe (optionnel)</el-divider>

      <el-form-item label="Mot de passe actuel">
        <el-input v-model="form.currentPassword" type="password" show-password />
      </el-form-item>
      <el-form-item label="Nouveau mot de passe">
        <el-input
          v-model="form.newPassword"
          type="password"
          show-password
          placeholder="Min. 12 caractères, avec lettres, chiffres et symboles"
        />
      </el-form-item>

      <el-alert
        v-if="errorMsg"
        :title="errorMsg"
        type="error"
        show-icon
        :closable="false"
        style="margin-top: 8px"
      />
    </el-form>

    <template #footer>
      <el-button @click="visible = false">Annuler</el-button>
      <el-button type="primary" :loading="loading" @click="submit">Enregistrer</el-button>
    </template>
  </el-dialog>
</template>
