<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Phone, Warning } from '@element-plus/icons-vue'
import type { AnimalEmergencyCard } from '@armali/schemas'
import { animalApi } from '../api'

const route = useRoute()

const card = ref<AnimalEmergencyCard | null>(null)
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
  try {
    card.value = await animalApi.getEmergencyCard(route.params.token as string)
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

function ageLabel(dateOfBirth: Date) {
  const dob = new Date(dateOfBirth)
  const now = new Date()
  let years = now.getFullYear() - dob.getFullYear()
  let months = now.getMonth() - dob.getMonth()
  if (now.getDate() < dob.getDate()) months -= 1
  if (months < 0) {
    years -= 1
    months += 12
  }
  if (years <= 0) return `${months} mois`
  if (months === 0) return `${years} an${years > 1 ? 's' : ''}`
  return `${years} an${years > 1 ? 's' : ''} et ${months} mois`
}

const telHref = (phone: string) => `tel:${phone.replace(/\s+/g, '')}`

const initial = computed(() => card.value?.name.charAt(0).toUpperCase() ?? '?')
</script>

<template>
  <div class="page">
    <div class="wrapper">
      <el-skeleton v-if="loading" :rows="8" animated />

      <div v-else-if="notFound" class="not-found">
        <h1>Fiche introuvable</h1>
        <p>Ce lien de carte d'urgence n'est plus valide.</p>
      </div>

      <template v-else-if="card">
        <div class="eyebrow">Fiche d'urgence animal</div>

        <div class="identity">
          <div class="avatar">
            <img v-if="card.photoUrl" :src="card.photoUrl" :alt="card.name" />
            <span v-else>{{ initial }}</span>
          </div>
          <h1>{{ card.name }}</h1>
          <p class="subtitle">
            {{ card.species }} · {{ card.breed }} · {{ ageLabel(card.dateOfBirth) }}
          </p>
        </div>

        <div v-if="card.healthConditions.length > 0" class="alert-box">
          <div class="alert-header">
            <el-icon><Warning /></el-icon>
            <span>Conditions de santé à connaître</span>
          </div>
          <ul class="condition-list">
            <li v-for="(condition, i) in card.healthConditions" :key="i">
              <strong>{{ condition.name }}</strong>
              <span v-if="condition.notes"> — {{ condition.notes }}</span>
            </li>
          </ul>
        </div>

        <div class="contact-card">
          <span class="contact-label">Propriétaire</span>
          <span class="contact-name">{{ card.owner.name }}</span>
          <a v-if="card.owner.phone" :href="telHref(card.owner.phone)" class="call-button">
            <el-icon><Phone /></el-icon>
            Appeler {{ card.owner.phone }}
          </a>
          <span v-else class="no-phone">Aucun numéro renseigné</span>
        </div>

        <div v-if="card.clinic" class="contact-card">
          <span class="contact-label">Clinique référente</span>
          <span class="contact-name">{{ card.clinic.name }}</span>
          <span class="contact-address">{{ card.clinic.address }}</span>
          <a :href="telHref(card.clinic.phone)" class="call-button call-button--secondary">
            <el-icon><Phone /></el-icon>
            Appeler {{ card.clinic.phone }}
          </a>
        </div>

        <p class="footer-note">
          Généré par Armali — merci d'avoir retrouvé {{ card.name }}.
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background: var(--el-fill-color-light);
  padding: var(--spacing-lg) var(--spacing-md);
}

.wrapper {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.not-found {
  text-align: center;
  padding-top: var(--spacing-4xl, 96px);
}
.not-found h1 {
  font-size: 20px;
  color: var(--el-text-color-primary);
}
.not-found p {
  color: var(--el-text-color-secondary);
}

.eyebrow {
  text-align: center;
  font-size: 12px;
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--el-text-color-secondary);
}

.identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2xs);
  background: var(--el-bg-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}
.avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--el-color-success-light-7);
  color: var(--el-color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: var(--fw-bold);
  margin-bottom: var(--spacing-xs);
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.identity h1 {
  font-size: 24px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}
.subtitle {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin: 0;
}

.alert-box {
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-5);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}
.alert-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: var(--fw-semibold);
  color: var(--el-color-danger);
  margin-bottom: var(--spacing-sm);
}
.condition-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xs);
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.contact-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--el-bg-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}
.contact-label {
  font-size: 11px;
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--el-text-color-secondary);
}
.contact-name {
  font-size: 16px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  margin-bottom: var(--spacing-2xs);
}
.contact-address {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: var(--spacing-sm);
}
.no-phone {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

.call-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-full);
  background: var(--el-color-primary);
  color: white;
  font-weight: var(--fw-semibold);
  font-size: 14px;
  text-decoration: none;
}
.call-button--secondary {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

.footer-note {
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin: 0;
}
</style>
