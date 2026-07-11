import { ref, computed } from 'vue'
import type { CreateVaccine, CreateVaccineCountryRule, Vaccine } from '@armali/schemas'

function emptyForm(): CreateVaccine {
  return {
    name: '',
    description: null,
    basePrice: 0,
    recommendedAge: 8,
    boosterInterval: 52,
    petId: '' as never,
    countryRules: [],
  }
}

function emptyRule(): CreateVaccineCountryRule {
  return { country: 'FR', minAge: 8, type: 'MANDATORY' }
}

export function useVaccineForm() {
  const visible = ref(false)
  const mode = ref<'create' | 'edit'>('create')
  const editingId = ref<string | null>(null)
  const form = ref<CreateVaccine>(emptyForm())

  const title = computed(() => (mode.value === 'create' ? 'Nouveau vaccin' : 'Modifier le vaccin'))
  const submitLabel = computed(() => (mode.value === 'create' ? 'Créer' : 'Enregistrer'))

  function openCreate() {
    form.value = emptyForm()
    mode.value = 'create'
    editingId.value = null
    visible.value = true
  }

  function openEdit(vaccine: Vaccine) {
    form.value = {
      name: vaccine.act?.name ?? '',
      description: vaccine.act?.description ?? null,
      basePrice: vaccine.act?.basePrice ?? 0,
      recommendedAge: vaccine.recommendedAge,
      boosterInterval: vaccine.boosterInterval,
      petId: vaccine.petId,
      countryRules: vaccine.countryRules.map((r) => ({
        country: r.country,
        minAge: r.minAge,
        type: r.type,
      })),
    }
    mode.value = 'edit'
    editingId.value = vaccine.id
    visible.value = true
  }

  function close() {
    visible.value = false
  }

  function addRule() {
    form.value.countryRules.push(emptyRule())
  }

  function removeRule(index: number) {
    form.value.countryRules.splice(index, 1)
  }

  return {
    visible,
    mode,
    editingId,
    form,
    title,
    submitLabel,
    openCreate,
    openEdit,
    close,
    addRule,
    removeRule,
  }
}
