<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import type { BookingClinic } from '@armali/schemas'

const { clinics, centerLat, centerLng } = defineProps<{
  clinics: BookingClinic[]
  centerLat: number | null
  centerLng: number | null
}>()

const emit = defineEmits<{
  onSelectedClinic: [clinic: BookingClinic]
}>()

const mapContainer = ref<HTMLElement | null>(null)

const map = ref<L.Map>()
const markersLayer = ref<L.LayerGroup>()

onMounted(() => {
  if (!mapContainer.value) return

  map.value = L.map(mapContainer.value)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map.value)

  markersLayer.value = L.layerGroup().addTo(map.value)
})

watch(
  () => clinics,
  (newClinics) => {
    if (!map.value || !markersLayer.value) return

    markersLayer.value.clearLayers()

    if (newClinics.length === 0) {
      map.value.setView([48.8566, 2.3522], 13)
      return
    }

    const bounds = L.latLngBounds([])

    // Ajoute le point de recherche s'il existe
    if (centerLat != null && centerLng != null) {
      bounds.extend([centerLat, centerLng])
    }

    newClinics.forEach((clinic) => {
      const position: L.LatLngExpression = [clinic.lat, clinic.lng]

      const marker = L.marker(position)

      marker.bindPopup(clinic.name)

      marker.on('click', () => emit('onSelectedClinic', clinic))

      markersLayer.value!.addLayer(marker)
      bounds.extend(position)
    })

    map.value.fitBounds(bounds, {
      padding: [40, 40],
    })
  },
  {
    immediate: true,
    deep: true,
  },
)

onUnmounted(() => {
  map.value?.remove()
})
</script>

<template>
  <div ref="mapContainer" class="map"></div>
</template>

<style scoped>
.map {
  width: 100%;
  height: 500px;
}
</style>
