<script setup lang="ts">
import type { Speciality, SpecialityId } from '@armali/schemas'
import { Close } from '@element-plus/icons-vue'

defineProps<{
  specialities: Speciality[]
  editing: boolean
}>()

const emit = defineEmits<{ remove: [id: SpecialityId] }>()

const activeNames = defineModel<string[]>('activeNames', { required: true })
</script>

<template>
  <el-collapse v-model="activeNames">
    <el-collapse-item v-for="spec in specialities" :key="spec.id" :name="spec.id">
      <template #title>
        <div class="spec-title">
          <span class="spec-name">{{ spec.name }}</span>
          <el-button
            v-if="editing"
            size="small"
            type="danger"
            circle
            :icon="Close"
            @click.stop="emit('remove', spec.id)"
          />
        </div>
      </template>

      <p class="spec-description">{{ spec.description }}</p>
    </el-collapse-item>
  </el-collapse>

  <p v-if="specialities.length === 0" class="empty-text-page">
    Aucune spécialité proposée pour le moment
  </p>
</template>

<style lang="scss" scoped>
.spec-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: var(--spacing-sm);
}

.spec-name {
  font-family: 'Nunito', sans-serif;
  font-size: 15px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
}

.spec-description {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
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
