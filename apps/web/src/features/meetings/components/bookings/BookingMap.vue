<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import L from 'leaflet'
import type { BookingClinic } from '@armali/schemas'

const props = defineProps<{
  clinics: BookingClinic[]
  centerLat?: number
  centerLng?: number
}>()

const emit = defineEmits<{
  onSelectedClinic: [clinic: BookingClinic]
}>()

const mapContainer = ref<HTMLElement | null>(null)
const map = ref<L.Map>()
const markersLayer = ref<L.LayerGroup>()
let resizeObserver: ResizeObserver | undefined

const PARIS_FALLBACK: L.LatLngExpression = [48.8566, 2.3522]

function renderClinics(newClinics: BookingClinic[]) {
  if (!map.value || !markersLayer.value) return

  markersLayer.value.clearLayers()

  if (newClinics.length === 0) {
    const center: L.LatLngExpression =
      props.centerLat != null && props.centerLng != null
        ? [props.centerLat, props.centerLng]
        : PARIS_FALLBACK
    map.value.setView(center, 13)
    return
  }

  const bounds = L.latLngBounds([])

  if (props.centerLat != null && props.centerLng != null) {
    bounds.extend([props.centerLat, props.centerLng])
  }

  newClinics.forEach((clinic) => {
    const position: L.LatLngExpression = [clinic.lat, clinic.lng]

    const marker = L.marker(position)
    marker.bindPopup(clinic.name)
    marker.on('click', () => emit('onSelectedClinic', clinic))

    markersLayer.value!.addLayer(marker)
    bounds.extend(position)
  })

  map.value.invalidateSize()
  map.value.fitBounds(bounds, {
    padding: [40, 40],
  })
}

onMounted(async () => {
  if (!mapContainer.value) return

  const initialCenter: L.LatLngExpression =
    props.centerLat != null && props.centerLng != null
      ? [props.centerLat, props.centerLng]
      : PARIS_FALLBACK

  map.value = L.map(mapContainer.value).setView(initialCenter, 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map.value)

  markersLayer.value = L.layerGroup().addTo(map.value)

  await nextTick()
  map.value.invalidateSize()

  renderClinics(props.clinics)

  resizeObserver = new ResizeObserver(() => {
    map.value?.invalidateSize()
  })
  resizeObserver.observe(mapContainer.value)
})

watch(
  () => props.clinics,
  (newClinics) => {
    renderClinics(newClinics)
  },
  { deep: true },
)

// Recentre explicitement quand l'adresse/géoloc change,
// indépendamment du fait que les cliniques changent ou non
watch(
  () => [props.centerLat, props.centerLng],
  ([lat, lng]) => {
    if (!map.value) return
    if (lat != null && lng != null) {
      map.value.setView([lat, lng], 13)
    }
  },
)

onUnmounted(() => {
  resizeObserver?.disconnect()
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
