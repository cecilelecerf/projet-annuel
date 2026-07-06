<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { staffApi } from '@/features/staff/api/staff.api'
import { specialitiesApi } from '@/features/clinic/api/specialities.api'
import type { Speciality, SpecialityId } from '@armali/schemas'

const router = useRouter()
const notify = useNotify()

const activeTab = ref<'veterinarian' | 'secretary'>('veterinarian')

// ── Vétérinaire ────────────────────────────────────────────────────────────

const vetForm = reactive({
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  licenseNumber: '',
  bio: '',
  birthCity: '',
  birthDepartment: '',
  birthCountry: '',
  nationality: '',
  inseNumber: '',
  diploma: '',
  diplomaObtainedAt: '',
  rppsNumber: '',
  orderRegisteredAt: '',
  practiceAuthorization: false,
  proPhone: '',
  iban: '',
  bic: '',
  domiciliation: '',
  beneficiary: '',
})

const selectedSpecialityIds = ref<string[]>([])
const specialityOptions = ref<Speciality[]>([])
const specialitySearchLoading = ref(false)

async function searchSpecialities(query: string) {
  if (!query) return
  specialitySearchLoading.value = true
  try {
    specialityOptions.value = await specialitiesApi.search(query)
  } catch {
    /* silencieux */
  } finally {
    specialitySearchLoading.value = false
  }
}

const loadingVet = ref(false)

function hasAnyIdentityField() {
  return !!(
    vetForm.birthCity ||
    vetForm.birthDepartment ||
    vetForm.birthCountry ||
    vetForm.nationality ||
    vetForm.inseNumber ||
    vetForm.diploma ||
    vetForm.diplomaObtainedAt ||
    vetForm.rppsNumber ||
    vetForm.orderRegisteredAt ||
    vetForm.practiceAuthorization
  )
}

function hasAnyBankingField() {
  return !!(vetForm.iban || vetForm.bic || vetForm.domiciliation || vetForm.beneficiary)
}

async function submitVet() {
  loadingVet.value = true
  try {
    await staffApi.createVeterinarian({
      firstname: vetForm.firstname,
      lastname: vetForm.lastname,
      email: vetForm.email,
      password: vetForm.password,
      licenseNumber: vetForm.licenseNumber,
      bio: vetForm.bio || undefined,
      specialityIds: selectedSpecialityIds.value.length
        ? (selectedSpecialityIds.value as SpecialityId[])
        : undefined,
      identity: hasAnyIdentityField()
        ? {
            birthCity: vetForm.birthCity || undefined,
            birthDepartment: vetForm.birthDepartment || undefined,
            birthCountry: vetForm.birthCountry || undefined,
            nationality: vetForm.nationality || undefined,
            inseNumber: vetForm.inseNumber || undefined,
            diploma: vetForm.diploma || undefined,
            diplomaObtainedAt: vetForm.diplomaObtainedAt
              ? new Date(vetForm.diplomaObtainedAt).toISOString()
              : undefined,
            rppsNumber: vetForm.rppsNumber || undefined,
            orderRegisteredAt: vetForm.orderRegisteredAt
              ? new Date(vetForm.orderRegisteredAt).toISOString()
              : undefined,
            practiceAuthorization: vetForm.practiceAuthorization,
            proPhone: vetForm.proPhone || undefined,
          }
        : undefined,
      bankingInfo: hasAnyBankingField()
        ? {
            iban: vetForm.iban || undefined,
            bic: vetForm.bic || undefined,
            domiciliation: vetForm.domiciliation || undefined,
            beneficiary: vetForm.beneficiary || undefined,
          }
        : undefined,
    })
    notify.success('Compte vétérinaire créé avec succès')
    router.push({ name: 'REFERENT.Staff' })
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la création')
  } finally {
    loadingVet.value = false
  }
}

// ── Secrétaire ─────────────────────────────────────────────────────────────

const secretaryForm = reactive({
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  iban: '',
  bic: '',
  domiciliation: '',
  beneficiary: '',
})

const loadingSecretary = ref(false)

function hasAnySecretaryBankingField() {
  return !!(
    secretaryForm.iban ||
    secretaryForm.bic ||
    secretaryForm.domiciliation ||
    secretaryForm.beneficiary
  )
}

async function submitSecretary() {
  loadingSecretary.value = true
  try {
    await staffApi.createSecretary({
      firstname: secretaryForm.firstname,
      lastname: secretaryForm.lastname,
      email: secretaryForm.email,
      password: secretaryForm.password,
      bankingInfo: hasAnySecretaryBankingField()
        ? {
            iban: secretaryForm.iban || undefined,
            bic: secretaryForm.bic || undefined,
            domiciliation: secretaryForm.domiciliation || undefined,
            beneficiary: secretaryForm.beneficiary || undefined,
          }
        : undefined,
    })
    notify.success('Compte secrétaire créé avec succès')
    router.push({ name: 'REFERENT.Staff' })
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la création')
  } finally {
    loadingSecretary.value = false
  }
}
</script>

<template>
  <div class="create-page">
    <div class="page-header">
      <el-button text @click="router.push({ name: 'REFERENT.Staff' })">
        ← Retour au personnel
      </el-button>
      <h1>Ajouter un membre</h1>
    </div>

    <div class="tabs-shell">
      <el-tabs v-model="activeTab" class="staff-tabs">
        <!-- ═══════════════════ VÉTÉRINAIRE ═══════════════════ -->
        <el-tab-pane label="Vétérinaire" name="veterinarian">
          <el-form label-position="top" @submit.prevent="submitVet">
            <div class="section">
              <h2>Informations de connexion</h2>
              <div class="grid grid--4">
                <el-form-item label="Prénom">
                  <el-input v-model="vetForm.firstname" />
                </el-form-item>
                <el-form-item label="Nom">
                  <el-input v-model="vetForm.lastname" />
                </el-form-item>
                <el-form-item label="Email">
                  <el-input v-model="vetForm.email" type="email" placeholder="email@exemple.com" />
                </el-form-item>
                <el-form-item label="Mot de passe provisoire">
                  <el-input v-model="vetForm.password" type="password" show-password />
                </el-form-item>
              </div>
            </div>

            <div class="section">
              <h2>Informations professionnelles</h2>
              <div class="grid grid--3">
                <el-form-item label="Numéro de licence">
                  <el-input v-model="vetForm.licenseNumber" placeholder="Numéro RPPS / licence" />
                </el-form-item>
                <el-form-item label="Spécialités" class="grid-span-2">
                  <el-select
                    v-model="selectedSpecialityIds"
                    multiple
                    filterable
                    remote
                    :remote-method="searchSpecialities"
                    :loading="specialitySearchLoading"
                    placeholder="Rechercher des spécialités..."
                    style="width: 100%"
                  >
                    <el-option
                      v-for="spec in specialityOptions"
                      :key="spec.id"
                      :label="spec.name"
                      :value="spec.id"
                    />
                  </el-select>
                </el-form-item>
              </div>
              <el-form-item label="Biographie (optionnel)">
                <el-input
                  v-model="vetForm.bio"
                  type="textarea"
                  :rows="2"
                  placeholder="Expériences, approche..."
                />
              </el-form-item>
            </div>

            <div class="section">
              <h2>Identité professionnelle <span class="optional-tag">optionnel</span></h2>
              <div class="grid grid--4">
                <el-form-item label="Ville de naissance">
                  <el-input v-model="vetForm.birthCity" />
                </el-form-item>
                <el-form-item label="Département de naissance">
                  <el-input v-model="vetForm.birthDepartment" />
                </el-form-item>
                <el-form-item label="Pays de naissance">
                  <el-input v-model="vetForm.birthCountry" />
                </el-form-item>
                <el-form-item label="Nationalité">
                  <el-input v-model="vetForm.nationality" />
                </el-form-item>
                <el-form-item label="Numéro INSEE">
                  <el-input v-model="vetForm.inseNumber" />
                </el-form-item>
                <el-form-item label="Diplôme">
                  <el-input v-model="vetForm.diploma" />
                </el-form-item>
                <el-form-item label="Date d'obtention">
                  <el-date-picker v-model="vetForm.diplomaObtainedAt" type="date" style="width: 100%" />
                </el-form-item>
                <el-form-item label="Numéro RPPS">
                  <el-input v-model="vetForm.rppsNumber" />
                </el-form-item>
                <el-form-item label="Date d'inscription à l'Ordre">
                  <el-date-picker v-model="vetForm.orderRegisteredAt" type="date" style="width: 100%" />
                </el-form-item>
                <el-form-item label="Téléphone professionnel">
                  <el-input v-model="vetForm.proPhone" />
                </el-form-item>
                <el-form-item label="Autorisation d'exercice">
                  <el-switch v-model="vetForm.practiceAuthorization" />
                </el-form-item>
              </div>
            </div>

            <div class="section">
              <h2>Coordonnées bancaires <span class="optional-tag">optionnel</span></h2>
              <div class="grid grid--4">
                <el-form-item label="IBAN">
                  <el-input v-model="vetForm.iban" />
                </el-form-item>
                <el-form-item label="BIC">
                  <el-input v-model="vetForm.bic" />
                </el-form-item>
                <el-form-item label="Domiciliation">
                  <el-input v-model="vetForm.domiciliation" />
                </el-form-item>
                <el-form-item label="Bénéficiaire">
                  <el-input v-model="vetForm.beneficiary" />
                </el-form-item>
              </div>
            </div>

            <el-button type="primary" size="large" native-type="submit" :loading="loadingVet">
              Créer le compte vétérinaire
            </el-button>
          </el-form>
        </el-tab-pane>

        <!-- ═══════════════════ SECRÉTAIRE ═══════════════════ -->
        <el-tab-pane label="Secrétaire" name="secretary">
          <el-form label-position="top" @submit.prevent="submitSecretary">
            <div class="section">
              <h2>Informations de connexion</h2>
              <div class="grid grid--4">
                <el-form-item label="Prénom">
                  <el-input v-model="secretaryForm.firstname" />
                </el-form-item>
                <el-form-item label="Nom">
                  <el-input v-model="secretaryForm.lastname" />
                </el-form-item>
                <el-form-item label="Email">
                  <el-input v-model="secretaryForm.email" type="email" />
                </el-form-item>
                <el-form-item label="Mot de passe provisoire">
                  <el-input v-model="secretaryForm.password" type="password" show-password />
                </el-form-item>
              </div>
            </div>

            <div class="section">
              <h2>Coordonnées bancaires <span class="optional-tag">optionnel</span></h2>
              <div class="grid grid--4">
                <el-form-item label="IBAN">
                  <el-input v-model="secretaryForm.iban" />
                </el-form-item>
                <el-form-item label="BIC">
                  <el-input v-model="secretaryForm.bic" />
                </el-form-item>
                <el-form-item label="Domiciliation">
                  <el-input v-model="secretaryForm.domiciliation" />
                </el-form-item>
                <el-form-item label="Bénéficiaire">
                  <el-input v-model="secretaryForm.beneficiary" />
                </el-form-item>
              </div>
            </div>

            <el-button type="primary" size="large" native-type="submit" :loading="loadingSecretary">
              Créer le compte secrétaire
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped>
.create-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.page-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.tabs-shell {
  width: 100%;
}
.staff-tabs {
  width: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 8px 28px 28px;
  box-sizing: border-box;
}

.section {
  margin-bottom: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid #f3f4f6;
}
.section:last-of-type {
  border-bottom: none;
  margin-bottom: 16px;
}
.section h2 {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 14px;
}
.optional-tag {
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  margin-left: 6px;
}

.grid {
  display: grid;
  gap: 0 16px;
}
.grid--3 {
  grid-template-columns: repeat(3, 1fr);
}
.grid--4 {
  grid-template-columns: repeat(4, 1fr);
}
.grid-span-2 {
  grid-column: span 2;
}

:deep(.el-form-item) {
  margin-bottom: 14px;
}

@media (max-width: 1024px) {
  .grid--4 {
    grid-template-columns: repeat(2, 1fr);
  }
  .grid--3 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .grid--4,
  .grid--3 {
    grid-template-columns: 1fr;
  }
  .grid-span-2 {
    grid-column: span 1;
  }
  .staff-tabs {
    padding: 8px 16px 20px;
  }
}
</style>