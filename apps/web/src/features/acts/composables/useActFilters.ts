import { computed, ref } from 'vue'
import type { Act } from '@armali/schemas'

export function useActFilters(acts: import('vue').Ref<Act[]>) {
  const search = ref('')

  const filteredActs = computed(() => {
    const query = search.value.trim().toLowerCase()
    if (!query) return acts.value
    return acts.value.filter((act) => act.name.toLowerCase().includes(query))
  })

  return { search, filteredActs }
}
