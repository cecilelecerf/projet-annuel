import { computed, ref, type Ref } from 'vue'
import type { Vaccine } from '@armali/schemas'

export function useVaccineFilters(vaccines: Ref<Vaccine[]>) {
  const search = ref('')

  const filteredVaccines = computed(() => {
    const query = search.value.trim().toLowerCase()
    if (!query) return vaccines.value
    return vaccines.value.filter((v) => v.act?.name.toLowerCase().includes(query))
  })

  return { search, filteredVaccines }
}
