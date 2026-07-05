<script setup lang="ts">
import type { User, Staff } from '@armali/schemas'
import SearchSelectMultiple from './SearchSelectMultiple.vue'

defineProps<{
  staffs: Staff[] | undefined
}>()

const title = defineModel<string>('title', { required: true })
const participants = defineModel<User[]>('participants', { required: true })
const location = defineModel<string>('location', { required: true })
</script>

<template>
  <div class="field">
    <label class="field-label">Titre</label>
    <el-input v-model="title" placeholder="Nom de la réunion" size="large" />
  </div>
  <SearchSelectMultiple
    v-model="participants"
    :items="staffs ?? []"
    display-key="lastname"
    secondary-key="firstname"
    placeholder="Rechercher des participants..."
  />
  <div class="field">
    <label class="field-label">Lieu</label>
    <el-input v-model="location" placeholder="Salle, adresse..." size="large">
      <template #prefix>
        <el-icon><Location /></el-icon>
      </template>
    </el-input>
  </div>
</template>

<style scoped lang="scss">
.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.field-label {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
