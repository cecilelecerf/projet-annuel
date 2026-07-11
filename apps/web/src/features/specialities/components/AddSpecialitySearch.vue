<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Speciality, SpecialityId } from '@armali/schemas'
import { Plus } from '@element-plus/icons-vue'

const props = defineProps<{
  allSpecialities: Speciality[]
  selectedIds: SpecialityId[]
}>()

const emit = defineEmits<{ add: [id: SpecialityId] }>()

const search = ref('')

const available = computed(() => {
  const query = search.value.trim().toLowerCase()
  return props.allSpecialities
    .filter((s) => !props.selectedIds.includes(s.id))
    .filter((s) => !query || s.name.toLowerCase().includes(query))
})
</script>

<template>
  <div class="add-speciality-search">
    <el-input v-model="search" placeholder="Rechercher une spécialité à ajouter..." clearable />

    <div v-if="available.length" class="available-list">
      <button
        v-for="spec in available"
        :key="spec.id"
        type="button"
        class="available-item"
        @click="emit('add', spec.id)"
      >
        <div class="available-item-text">
          <span class="available-name">{{ spec.name }}</span>
          <span class="available-desc">{{ spec.description }}</span>
        </div>
        <el-icon><Plus /></el-icon>
      </button>
    </div>
    <p v-else class="empty-text">
      {{
        search ? 'Aucune spécialité correspondante' : 'Toutes les spécialités sont déjà ajoutées'
      }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
.add-speciality-search {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.available-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xs, 4px);
  max-height: 320px;
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
  text-align: left;
  transition:
    background 0.15s,
    border-color 0.15s;

  &:hover {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
  }
}

.available-item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.available-name {
  font-size: 14px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}

.available-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-text {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
  margin: var(--spacing-sm) 0 0;
}
</style>
