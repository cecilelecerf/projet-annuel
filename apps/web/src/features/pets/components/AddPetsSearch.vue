<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Pet } from '@armali/schemas'
import { Plus } from '@element-plus/icons-vue'

const props = defineProps<{
  allPets: Pet[]
  selectedPetIds: string[]
}>()

const emit = defineEmits<{ add: [petId: string] }>()

const search = ref('')

const availablePets = computed(() => {
  const query = search.value.trim().toLowerCase()
  return props.allPets
    .filter((p) => !props.selectedPetIds.includes(p.id))
    .filter((p) => !query || p.name.toLowerCase().includes(query))
})
</script>

<template>
  <div class="add-pet-search">
    <el-input v-model="search" placeholder="Rechercher une espèce à ajouter..." clearable />

    <div v-if="availablePets.length" class="available-list">
      <button
        v-for="pet in availablePets"
        :key="pet.id"
        type="button"
        class="available-item"
        @click="emit('add', pet.id)"
      >
        <span>{{ pet.name }}</span>
        <el-icon><Plus /></el-icon>
      </button>
    </div>
    <p v-else class="empty-text">
      {{ search ? 'Aucune espèce correspondante' : 'Toutes les espèces sont déjà acceptées' }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
.add-pet-search {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.available-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xs, 4px);
  max-height: 200px;
  overflow-y: auto;
}

.available-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-md);
  background: var(--el-bg-color);
  cursor: pointer;
  font-size: 14px;
  color: var(--el-text-color-primary);
  transition:
    background 0.15s,
    border-color 0.15s;

  &:hover {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
    color: var(--el-color-primary);
  }
}

.empty-text {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
  margin: var(--spacing-sm) 0 0;
}
</style>
