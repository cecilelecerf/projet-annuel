import { computed, ref, type Ref } from 'vue'
import type { ClinicAct } from '@armali/schemas'

export function useClinicActFilters(clinicActs: Ref<ClinicAct[]>) {
  const search = ref('')

  const filteredClinicActs = computed(() => {
    const query = search.value.trim().toLowerCase()
    if (!query) return clinicActs.value
    return clinicActs.value.filter((ca) => ca.act?.name.toLowerCase().includes(query))
  })

  return { search, filteredClinicActs }
}
