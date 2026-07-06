<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { staffApi } from '@/features/staffs/staff.api'
import type { StaffMemberDetail } from '@armali/schemas'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const notify = useNotify()
const { user } = useAuthStore()

const member = ref<StaffMemberDetail | null>(null)
const loading = ref(false)
const roleLabel: Record<string, string> = {
  DIRECTOR: 'Directeur',
  REFERENT: 'Référent',
  VETERINARIAN: 'Vétérinaire',
  SECRETARY: 'Secrétaire',
}

const hasRightColumn = computed(
  () => member.value?.role === 'VETERINARIAN' || member.value?.role === 'SECRETARY',
)

async function load() {
  loading.value = true
  try {
    member.value = await staffApi.getById(route.params.id as string)
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger ce profil')
  } finally {
    loading.value = false
  }
}

onMounted(load)

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fr-FR')
}

function formatLongDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="detail-page" v-loading="loading">
    <div class="page-header">
      <el-button text @click="router.push({ name: `${user?.role?.toUpperCase()}.Staff` })">
        ← Retour au personnel
      </el-button>
    </div>

    <template v-if="member">
      <div class="profile-header">
        <div class="avatar">{{ member.firstname[0] }}{{ member.lastname[0] }}</div>
        <div>
          <h1>{{ member.firstname }} {{ member.lastname }}</h1>
          <p>{{ member.email }}</p>
        </div>
        <el-tag size="large">{{ roleLabel[member.role] }}</el-tag>
      </div>

      <div class="layout" :class="{ 'layout--single': !hasRightColumn }">
        <!-- ═══════════════ COLONNE GAUCHE ═══════════════ -->
        <div class="col-left">
          <div class="card">
            <h2>Informations personnelles</h2>
            <div class="info-grid info-grid--2">
              <div class="info-item">
                <span class="label">Prénom</span>
                <span class="value">{{ member.firstname }}</span>
              </div>
              <div class="info-item">
                <span class="label">Nom</span>
                <span class="value">{{ member.lastname }}</span>
              </div>
              <div class="info-item info-item--wide">
                <span class="label">Email</span>
                <span class="value">{{ member.email }}</span>
              </div>
              <div class="info-item info-item--wide">
                <span class="label">Membre depuis</span>
                <span class="value">{{ formatLongDate(member.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══════════════ COLONNE DROITE ═══════════════ -->
        <div class="col-right" v-if="hasRightColumn">
          <!-- Vétérinaire -->
          <template v-if="member.role === 'VETERINARIAN' && member.veterinarianProfile">
            <div class="card">
              <h2>Informations professionnelles</h2>
              <div class="info-grid info-grid--2">
                <div class="info-item">
                  <span class="label">Numéro de licence</span>
                  <span class="value">{{ member.veterinarianProfile.licenseNumber }}</span>
                </div>
                <div class="info-item info-item--wide">
                  <span class="label">Biographie</span>
                  <span class="value">{{
                    member.veterinarianProfile.bio || 'Aucune biographie'
                  }}</span>
                </div>
              </div>
              <template v-if="member.veterinarianProfile.specialities?.length">
                <div class="sub-label">Spécialités</div>
                <div class="tags-row">
                  <el-tag v-for="spec in member.veterinarianProfile.specialities" :key="spec.id">
                    {{ spec.name }}
                  </el-tag>
                </div>
              </template>
            </div>

            <div class="card" v-if="member.veterinarianProfile.veterinarianIdentity">
              <h2>Identité professionnelle</h2>
              <div class="info-grid info-grid--3">
                <div class="info-item">
                  <span class="label">Ville de naissance</span>
                  <span class="value">{{
                    member.veterinarianProfile.veterinarianIdentity.birthCity || '—'
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Département de naissance</span>
                  <span class="value">{{
                    member.veterinarianProfile.veterinarianIdentity.birthDepartment || '—'
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Pays de naissance</span>
                  <span class="value">{{
                    member.veterinarianProfile.veterinarianIdentity.birthCountry || '—'
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Nationalité</span>
                  <span class="value">{{
                    member.veterinarianProfile.veterinarianIdentity.nationality || '—'
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Numéro INSEE</span>
                  <span class="value">{{
                    member.veterinarianProfile.veterinarianIdentity.inseNumber || '—'
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Téléphone professionnel</span>
                  <span class="value">{{
                    member.veterinarianProfile.veterinarianIdentity.proPhone || '—'
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Diplôme</span>
                  <span class="value">{{
                    member.veterinarianProfile.veterinarianIdentity.diploma || '—'
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Date d'obtention</span>
                  <span class="value">{{
                    formatDate(member.veterinarianProfile.veterinarianIdentity.diplomaObtainedAt)
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Numéro RPPS</span>
                  <span class="value">{{
                    member.veterinarianProfile.veterinarianIdentity.rppsNumber || '—'
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Date d'inscription à l'Ordre</span>
                  <span class="value">{{
                    formatDate(member.veterinarianProfile.veterinarianIdentity.orderRegisteredAt)
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Autorisation d'exercice</span>
                  <el-tag
                    :type="
                      member.veterinarianProfile.veterinarianIdentity.practiceAuthorization
                        ? 'success'
                        : 'info'
                    "
                    size="small"
                  >
                    {{
                      member.veterinarianProfile.veterinarianIdentity.practiceAuthorization
                        ? 'Oui'
                        : 'Non renseigné'
                    }}
                  </el-tag>
                </div>
              </div>
            </div>

            <div class="card" v-if="member.veterinarianProfile.bankingInfo">
              <h2>Coordonnées bancaires</h2>
              <div class="info-grid info-grid--2">
                <div class="info-item">
                  <span class="label">IBAN</span>
                  <span class="value">{{
                    member.veterinarianProfile.bankingInfo.iban || '—'
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="label">BIC</span>
                  <span class="value">{{ member.veterinarianProfile.bankingInfo.bic || '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Domiciliation</span>
                  <span class="value">{{
                    member.veterinarianProfile.bankingInfo.domiciliation || '—'
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Bénéficiaire</span>
                  <span class="value">{{
                    member.veterinarianProfile.bankingInfo.beneficiary || '—'
                  }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Secrétaire -->
          <template v-if="member.role === 'SECRETARY'">
            <div class="card" v-if="member.secretaryProfile?.bankingInfo">
              <h2>Coordonnées bancaires</h2>
              <div class="info-grid info-grid--2">
                <div class="info-item">
                  <span class="label">IBAN</span>
                  <span class="value">{{ member.secretaryProfile.bankingInfo.iban || '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">BIC</span>
                  <span class="value">{{ member.secretaryProfile.bankingInfo.bic || '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Domiciliation</span>
                  <span class="value">{{
                    member.secretaryProfile.bankingInfo.domiciliation || '—'
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Bénéficiaire</span>
                  <span class="value">{{
                    member.secretaryProfile.bankingInfo.beneficiary || '—'
                  }}</span>
                </div>
              </div>
            </div>
            <div class="card" v-else>
              <h2>Coordonnées bancaires</h2>
              <p class="no-data">Aucune coordonnée bancaire renseignée pour ce membre.</p>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  margin-bottom: var(--spacing-md);
}
.profile-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background: var(--el-bg-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-lg) var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}
.avatar {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-full);
  background: var(--el-color-yellow-light-5);
  color: var(--el-color-yellow);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-xl);
  font-weight: var(--fw-bold);
  flex-shrink: 0;
}
.profile-header h1 {
  font-size: var(--fs-2xl);
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-2xs);
}
.profile-header p {
  color: var(--el-text-color-secondary);
  margin: 0;
  font-size: var(--fs-md);
}
.profile-header .el-tag {
  margin-left: auto;
}

.layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: var(--spacing-lg);
}

.layout--single {
  grid-template-columns: 1fr;
}

.col-left,
.col-right {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  min-height: 0;
}

.col-left .card {
  min-height: 0;
}

.card {
  background: var(--el-bg-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 22px var(--spacing-lg);
}
.card h2 {
  font-size: var(--fs-md);
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  margin: 0 0 14px;
}

.info-grid {
  display: grid;
  gap: var(--spacing-md);
}
.info-grid--2 {
  grid-template-columns: repeat(2, 1fr);
}
.info-grid--3 {
  grid-template-columns: repeat(3, 1fr);
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.info-item--wide {
  grid-column: span 2;
}
.label {
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
}
.value {
  font-size: var(--fs-md);
  color: var(--el-text-color-primary);
}
.sub-label {
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
  margin: var(--spacing-md) 0 var(--spacing-sm);
}
.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}
.no-data {
  color: var(--el-text-color-placeholder);
  font-size: var(--fs-md);
  margin: 0;
}

@include below('lg') {
  .layout {
    grid-template-columns: 1fr;
  }
  .info-grid--3 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@include below('xs') {
  .info-grid--2,
  .info-grid--3 {
    grid-template-columns: 1fr;
  }
  .info-item--wide {
    grid-column: span 1;
  }
}
</style>
