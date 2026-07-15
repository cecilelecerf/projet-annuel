<script setup lang="ts">
import { ref } from 'vue'
import LegalLayout from '@/components/landingPage/LegalLayout.vue'
import { http } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()

const form = ref({
  name: '',
  email: '',
  subject: '',
  message: '',
})
const loading = ref(false)
const sent = ref(false)

function validate(): string | null {
  if (!form.value.name.trim()) return 'Le nom est requis'
  if (!form.value.email.includes('@')) return 'Email invalide'
  if (!form.value.subject.trim()) return 'Le sujet est requis'
  if (form.value.message.trim().length < 10)
    return 'Le message doit contenir au moins 10 caractères'
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
    await http.post('/contact', form.value)
    sent.value = true
    notify.success('Votre message a bien été envoyé')
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : "Erreur lors de l'envoi du message")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <LegalLayout title="Nous contacter">
    <p>
      Une question, une remarque, un problème technique ? Remplissez le formulaire ci-dessous, nous
      vous répondrons dans les meilleurs délais à l'adresse indiquée.
    </p>

    <el-result
      v-if="sent"
      icon="success"
      title="Message envoyé"
      sub-title="Merci, nous revenons vers vous rapidement."
    >
      <template #extra>
        <el-button type="primary" @click="sent = false">Envoyer un autre message</el-button>
      </template>
    </el-result>

    <el-form v-else class="contact-form" @submit.prevent="handleSubmit" label-position="top">
      <el-form-item label="Nom">
        <el-input v-model="form.name" size="large" />
      </el-form-item>

      <el-form-item label="Email">
        <el-input v-model="form.email" type="email" placeholder="votre@email.fr" size="large" />
      </el-form-item>

      <el-form-item label="Sujet">
        <el-input v-model="form.subject" size="large" />
      </el-form-item>

      <el-form-item label="Message">
        <el-input v-model="form.message" type="textarea" :rows="6" />
      </el-form-item>

      <el-button type="primary" native-type="submit" size="large" :loading="loading">
        Envoyer le message
      </el-button>
    </el-form>
  </LegalLayout>
</template>

<style scoped lang="scss">
.contact-form {
  max-width: 520px;
  margin-top: $spacing-xl;
}
</style>
