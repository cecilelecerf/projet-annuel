import { ref, computed } from 'vue'
import type {
  BookingAnimal,
  BookingFilters,
  BookingClinic,
  BookingVet,
  BookingSlot,
  SpecialityId,
} from '@armali/schemas'

export type BookingStep = 1 | 2 | 3 | 4

export function useBooking() {
  const step = ref<BookingStep>(1)

  // ── Étape 1 — Animal + motif ──────────────────────────────────────────────
  const selectedAnimal = ref<BookingAnimal | null>(null)
  const selectedSpecialityId = ref<SpecialityId | null>(null)
  const reason = ref('')

  // ── Étape 2 — Filtres + clinique ──────────────────────────────────────────
  const filters = ref<BookingFilters>({
    lat: undefined,
    lng: undefined,
    address: '',
    radiusKm: 20,
    date: undefined,
    specialityId: null,
    petId: null,
  })

  const selectedClinic = ref<BookingClinic | null>(null)

  // ── Étape 3 — Veto + créneau ──────────────────────────────────────────────
  const selectedVet = ref<BookingVet | null>(null)
  const selectedSlot = ref<BookingSlot | null>(null)

  // ── Navigation ────────────────────────────────────────────────────────────
  const canGoNext = computed(() => {
    if (step.value === 1) return !!selectedAnimal.value
    if (step.value === 2) return !!selectedClinic.value
    if (step.value === 3) return !!selectedVet.value && !!selectedSlot.value
    return false
  })

  function next() {
    if (canGoNext.value && step.value < 4) step.value = (step.value + 1) as BookingStep
  }

  function back() {
    if (step.value > 1) step.value = (step.value - 1) as BookingStep
  }

  function goTo(s: BookingStep) {
    step.value = s
  }

  function reset() {
    step.value = 1
    selectedAnimal.value = null
    selectedSpecialityId.value = null
    reason.value = ''
    filters.value = {
      lat: undefined,
      lng: undefined,
      address: '',
      radiusKm: 20,
      date: undefined,
      specialityId: null,
      petId: null,
    }
    selectedClinic.value = null
    selectedVet.value = null
    selectedSlot.value = null
  }

  return {
    step,
    selectedAnimal,
    selectedSpecialityId,
    reason,
    filters,
    selectedClinic,
    selectedVet,
    selectedSlot,
    canGoNext,
    next,
    back,
    goTo,
    reset,
  }
}
