<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { http, API_ORIGIN } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'
import AddressFields from '@/components/AddressFields.vue'
import OpeningHoursEditor from '@/components/OpeningHoursEditor.vue'
import ClinicSpecialities from '@/components/ClinicSpecialities.vue'
import { formatAddress, defaultOpeningHours, type OpeningHoursDay } from '@/utils/clinic.utils'

const notify = useNotify()

interface Speciality {
  id: string
  name: string
  description: string
}

interface Clinic {
  id: string
  name: string
  street: string
  postalCode: string
  city: string
  country: string
  phone: string
  website: string
  description?: string
  openingHours?: OpeningHoursDay[] | null
  speciality?: Speciality[]
  image?: string | null
}

const clinic = ref<Clinic | null>(null)
const form = reactive({
  street: '',
  postalCode: '',
  city: '',
  country: 'FR',
  openingHours: defaultOpeningHours(),
})
const loading = ref(false)

async function loadClinic() {
  try {
    const data = await http.get<Clinic>('/clinics/me')
    clinic.value = data
    form.street = data.street ?? ''
    form.postalCode = data.postalCode ?? ''
    form.city = data.city ?? ''
    form.country = data.country ?? 'FR'
    form.openingHours = data.openingHours?.length ? data.openingHours : defaultOpeningHours()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger la clinique')
  }
}

async function save() {
  loading.value = true
  try {
    const updated: Clinic = await http.patch<Clinic>('/referent/clinic', form)
    clinic.value = updated
    notify.success('Clinique mise à jour avec succès')
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
  } finally {
    loading.value = false
  }
}

onMounted(loadClinic)

const uploadingImage = ref(false)
const imageInput = ref<HTMLInputElement | null>(null)

async function onImageSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadingImage.value = true
  try {
    clinic.value = await http.upload<Clinic>('/clinics/me/image', 'image', file)
    notify.success('Image de la clinique mise à jour')
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : "Erreur lors de l'envoi de l'image")
  } finally {
    uploadingImage.value = false
    ;(e.target as HTMLInputElement).value = ''
  }
}
</script>

<template>
  <div class="clinic-page">
    <div class="page-header">
      <h1>Ma clinique</h1>
      <p v-if="clinic">{{ clinic.name }}</p>
    </div>

    <div v-if="clinic" class="form-card">
      <h2>Image de la clinique</h2>
      <div class="clinic-image-block">
        <img
          v-if="clinic.image"
          :src="`${API_ORIGIN}${clinic.image}`"
          alt="Image de la clinique"
          class="clinic-image"
        />
        <div v-else class="clinic-image-placeholder">Aucune image</div>
        <input
          ref="imageInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          @change="onImageSelected"
        />
        <el-button size="small" :loading="uploadingImage" @click="imageInput?.click()">
          {{ clinic.image ? "Changer l'image" : 'Ajouter une image' }}
        </el-button>
      </div>
    </div>

    <div class="form-card">
      <h2>Adresse</h2>
      <el-form label-position="top" @submit.prevent="save">
        <AddressFields v-model="form" />
      </el-form>

      <h2>Horaires d'ouverture</h2>
      <OpeningHoursEditor v-model="form.openingHours" />

      <el-button type="primary" :loading="loading" style="margin-top: 20px" @click="save">
        Enregistrer
      </el-button>
    </div>

    <div v-if="clinic" class="info-card">
      <h2>Informations actuelles</h2>
      <p>
        <strong>Adresse :</strong>
        {{ formatAddress(clinic) }}
      </p>
    </div>

    <div v-if="clinic" class="form-card">
      <h2>Spécialités de la clinique</h2>
      <ClinicSpecialities
        api-prefix="referent"
        :linked="clinic.speciality ?? []"
        @change="loadClinic"
      />
    </div>
  </div>
</template>

<style scoped>
.clinic-page {
}
.page-header {
  margin-bottom: 32px;
}
.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 4px;
}
.page-header p {
  color: #6b7280;
  margin: 0;
  font-size: 14px;
}
.form-card,
.info-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 24px;
}
.form-card h2,
.info-card h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 20px;
}
.info-card p {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.6;
}
.clinic-image-block {
  display: flex;
  align-items: center;
  gap: 16px;
}
.clinic-image {
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
  background: #f3f4f6;
}
.clinic-image-placeholder {
  width: 120px;
  height: 90px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #9ca3af;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
</style>
