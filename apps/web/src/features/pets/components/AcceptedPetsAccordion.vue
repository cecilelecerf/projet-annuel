<script setup lang="ts">
import type { Pet, Race } from '@armali/schemas'
import { Close } from '@element-plus/icons-vue'

defineProps<{
  pets: Pet[]
  racesByPet: Record<string, Race[]>
  loadingRaces: Record<string, boolean>
  editing: boolean
}>()

const emit = defineEmits<{
  expand: [petId: string]
  remove: [petId: string]
}>()

const activeNames = defineModel<string[]>('activeNames', { required: true })

function onChange(names: string | string[]) {
  const opened = Array.isArray(names) ? names : [names]
  opened.forEach((petId) => emit('expand', petId))
}
</script>

<template>
  <el-collapse v-model="activeNames" @change="onChange">
    <el-collapse-item v-for="pet in pets" :key="pet.id" :name="pet.id">
      <template #title>
        <div class="pet-title">
          <div class="pet-name-root">
            <span class="pet-name">{{ pet.name }}</span>
            <span class="race-count">{{ racesByPet[pet.id]?.length ?? '…' }} race(s)</span>
          </div>
          <el-button
            v-if="editing"
            size="small"
            type="danger"
            circle
            :icon="Close"
            @click.stop="emit('remove', pet.id)"
          />
        </div>
      </template>

      <div v-loading="loadingRaces[pet.id]" class="races-content">
        <div v-if="racesByPet[pet.id]?.length" class="races-tags">
          <el-tag v-for="race in racesByPet[pet.id]" :key="race.id" size="small">
            {{ race.name }}
          </el-tag>
        </div>
        <p v-else-if="!loadingRaces[pet.id]" class="empty-text">
          Aucune race enregistrée pour cette espèce
        </p>
      </div>
    </el-collapse-item>
  </el-collapse>

  <p v-if="pets.length === 0" class="empty-text-page">Aucune espèce acceptée pour le moment</p>
</template>

<style lang="scss" scoped>
.pet-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: var(--spacing-sm);
}

.pet-name-root {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  flex: 1;
}

.pet-name {
  font-family: 'Nunito', sans-serif;
  font-size: 15px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
}

.race-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.races-content {
  min-height: 32px;
}

.races-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.empty-text {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
  margin: 0;
}

.empty-text-page {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
  text-align: center;
  padding: var(--spacing-2xl) 0;
}
</style>
