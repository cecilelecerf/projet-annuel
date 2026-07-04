<script setup lang="ts">
import { ref, computed } from 'vue'
import { Location } from '@element-plus/icons-vue'
import { bookingApi } from '../booking.api'
import type { BookingAnimal, BookingClinic, BookingFilters } from '@armali/schemas'

const props = defineProps<{
  animal: BookingAnimal
  initialSpecialityId?: string | null
}>()

const filters = defineModel<BookingFilters>('filters', { required: true })
const selectedClinic = defineModel<BookingClinic | null>('clinic', { required: true })

const locating = ref(false)
const locationError = ref('')
const clinicsLoading = ref(false)
const mapView = ref(true)
const clinics = ref<BookingClinic[]>([])

async function geolocate() {
  locating.value = true
  locationError.value = ''
  try {
    const pos = await new Promise<GeolocationPosition>((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej),
    )
    filters.value.lat = pos.coords.latitude
    filters.value.lng = pos.coords.longitude
    filters.value.address = 'Ma position actuelle'
    await searchClinics()
  } catch {
    locationError.value = 'Géolocalisation refusée. Saisissez une adresse.'
  } finally {
    locating.value = false
  }
}

async function searchClinics() {
  clinicsLoading.value = true
  try {
    clinics.value = await bookingApi.searchClinics({
      lat: filters.value.lat ?? undefined,
      lng: filters.value.lng ?? undefined,
      address: filters.value.address || undefined,
      radiusKm: filters.value.radiusKm,
      date: filters.value.date,
      specialityId: filters.value.specialityId ?? undefined,
      petId: props.animal.race.petId,
    })
  } finally {
    clinicsLoading.value = false
  }
}

const sortedClinics = computed(() => [...clinics.value].sort((a, b) => a.distanceKm - b.distanceKm))

const TODAY = new Date().toISOString().split('T')[0]
</script>

<template>
  <div class="step">
    <div class="step-intro">
      <h2 class="step-title">Choisissez une clinique</h2>
      <p class="step-desc">
        Recherche pour <strong>{{ animal.name }}</strong> ({{ animal.race.pet.name }} ·
        {{ animal.race.name }})
      </p>
    </div>

    <div class="filters-card">
      <div class="filter-row">
        <div class="filter-group" style="flex: 2">
          <label class="filter-label">Localisation</label>
          <div class="location-input">
            <el-input
              v-model="filters.address"
              placeholder="Ville, adresse..."
              :prefix-icon="Location"
              clearable
              @change="searchClinics"
            />
            <el-button
              :loading="locating"
              :icon="Location"
              @click="geolocate"
              title="Ma position"
            />
          </div>
          <p v-if="locationError" class="location-error">{{ locationError }}</p>
        </div>

        <div class="filter-group">
          <label class="filter-label">Rayon</label>
          <el-select v-model="filters.radiusKm" @change="searchClinics">
            <el-option label="5 km" :value="5" />
            <el-option label="10 km" :value="10" />
            <el-option label="20 km" :value="20" />
            <el-option label="50 km" :value="50" />
          </el-select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Date souhaitée</label>
          <el-date-picker
            v-model="filters.date"
            type="date"
            value-format="YYYY-MM-DD"
            :disabled-date="(d: Date) => d < new Date(TODAY)"
            placeholder="N'importe quand"
            clearable
            @change="searchClinics"
          />
        </div>
      </div>
    </div>

    <div class="results-header">
      <span class="results-count">{{ sortedClinics.length }} cliniques trouvées</span>
      <div class="view-toggle">
        <el-button size="small" :type="mapView ? 'primary' : ''" @click="mapView = true"
          >Carte</el-button
        >
        <el-button size="small" :type="!mapView ? 'primary' : ''" @click="mapView = false"
          >Liste</el-button
        >
      </div>
    </div>

    <div class="results-body" :class="{ 'results-body--map': mapView }">
      <div v-show="mapView" class="map-container">
        <div class="map-placeholder">
          <el-icon style="font-size: 48px; color: var(--el-text-color-placeholder)"
            ><Location
          /></el-icon>
          <p>Carte des cliniques</p>
        </div>
      </div>

      <div class="clinic-list" :class="{ 'clinic-list--sidebar': mapView }">
        <el-skeleton v-if="clinicsLoading" :rows="3" animated />

        <button
          v-for="clinic in sortedClinics"
          v-else
          :key="clinic.id"
          class="clinic-card"
          :class="{ 'clinic-card--selected': selectedClinic?.id === clinic.id }"
          @click="selectedClinic = clinic"
        >
          <div class="clinic-card-header">
            <div class="clinic-card-info">
              <span class="clinic-name">{{ clinic.name }}</span>
              <span class="clinic-address">
                <el-icon><Location /></el-icon>{{ clinic.address }}
              </span>
            </div>
            <div class="clinic-meta">
              <span class="clinic-distance">{{ clinic.distanceKm }} km</span>
              <span v-if="clinic.rating" class="clinic-rating">⭐ {{ clinic.rating }}</span>
            </div>
          </div>
          <div class="clinic-card-footer">
            <div class="clinic-tags">
              <el-tag
                v-for="s in clinic.specialities.slice(0, 2)"
                :key="s"
                size="small"
                type="primary"
                round
                >{{ s }}</el-tag
              >
              <el-tag v-if="clinic.specialities.length > 2" size="small" type="info" round
                >+{{ clinic.specialities.length - 2 }}</el-tag
              >
            </div>
            <span v-if="clinic.nextSlot" class="clinic-next-slot">🕐 {{ clinic.nextSlot }}</span>
          </div>
        </button>

        <div
          v-if="!clinicsLoading && sortedClinics.length === 0 && filters.address"
          class="empty-clinics"
        >
          <p>Aucune clinique trouvée dans ce rayon. Essayez d'élargir la recherche.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.step {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}
.step-intro {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.step-title {
  font-family: 'Nunito', sans-serif;
  font-size: 22px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}
.step-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}
.filters-card {
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}
.filter-row {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
  min-width: 160px;
}
.filter-label {
  font-size: 12px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.location-input {
  display: flex;
  gap: var(--spacing-xs);
}
.location-error {
  font-size: 12px;
  color: var(--el-color-danger);
  margin: 0;
}
.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.results-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.view-toggle {
  display: flex;
  gap: 4px;
}
.results-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  &--map {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--spacing-md);
    height: 480px;
  }
}
.map-container {
  flex: 1;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  height: 100%;
}
.map-placeholder {
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  color: var(--el-text-color-secondary);
}
.clinic-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  &--sidebar {
    width: 360px;
    flex-shrink: 0;
    overflow-y: auto;
    height: 100%;
  }
}
.clinic-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  cursor: pointer;
  text-align: left;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.15s;
  width: 100%;
  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }
  &--selected {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}
.clinic-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-md);
}
.clinic-card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.clinic-name {
  font-size: 14px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}
.clinic-address {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  .el-icon {
    font-size: 11px;
  }
}
.clinic-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}
.clinic-distance {
  font-size: 12px;
  font-weight: var(--fw-semibold);
  color: var(--el-color-primary);
}
.clinic-rating {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.clinic-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}
.clinic-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.clinic-next-slot {
  font-size: 12px;
  color: var(--el-color-success);
  font-weight: var(--fw-medium);
  white-space: nowrap;
  flex-shrink: 0;
}
.empty-clinics {
  padding: var(--spacing-xl);
  text-align: center;
  p {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}
</style>
