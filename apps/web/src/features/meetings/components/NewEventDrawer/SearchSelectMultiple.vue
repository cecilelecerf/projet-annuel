<!-- SearchSelect.vue -->
<script setup lang="ts" generic="T extends { id: string }">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: T[]
  items: T[]
  placeholder?: string
  displayKey: keyof T
  secondaryKey?: keyof T
  max?: number
  locked?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: T[]]
}>()

const search = ref('')

const filtered = computed(() => {
  if (search.value.length < 2) return []
  const q = search.value.toLowerCase()
  return props.items.filter((item) => {
    const primary = String(item[props.displayKey]).toLowerCase()
    const secondary = props.secondaryKey ? String(item[props.secondaryKey]).toLowerCase() : ''
    return primary.includes(q) || secondary.includes(q)
  })
})

const isSelected = (item: T) => props.modelValue.some((s) => s.id === item.id)
const isMaxReached = computed(() => props.max !== undefined && props.modelValue.length >= props.max)

const select = (item: T) => {
  if (isSelected(item) || isMaxReached.value) return
  emit('update:modelValue', [...props.modelValue, item])
  search.value = ''
}

const remove = (item: T) => {
  if (props.locked) return
  emit(
    'update:modelValue',
    props.modelValue.filter((s) => s.id !== item.id),
  )
}

const getLabel = (item: T) => {
  const primary = String(item[props.displayKey])
  const secondary = props.secondaryKey ? String(item[props.secondaryKey]) : ''
  return secondary ? `${primary} ${secondary}` : primary
}

const getInitial = (item: T) => getLabel(item).charAt(0).toUpperCase()
</script>

<template>
  <div class="search-select">
    <div v-if="!locked || modelValue.length === 0" class="input-wrapper">
      <el-input
        v-model="search"
        :placeholder="placeholder ?? 'Rechercher...'"
        :disabled="isMaxReached && !locked"
        size="large"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <div v-if="filtered.length > 0" class="suggestions">
        <div
          v-for="item in filtered"
          :key="item.id"
          class="suggestion-item"
          :class="{ disabled: isSelected(item) }"
          @click="select(item)"
        >
          <div class="suggestion-avatar">{{ getInitial(item) }}</div>
          <span>{{ getLabel(item) }}</span>
          <el-icon v-if="isSelected(item)" class="check-icon"><Check /></el-icon>
        </div>
      </div>

      <div v-else-if="search.length >= 2" class="no-results">Aucun résultat</div>
    </div>

    <div v-if="modelValue.length > 0" class="chips">
      <div v-for="item in modelValue" :key="item.id" class="chip" :class="{ locked }">
        <div class="chip-avatar">{{ getInitial(item) }}</div>
        <span class="chip-name">{{ getLabel(item) }}</span>
        <el-icon v-if="!locked" class="chip-remove" @click="remove(item)">
          <Close />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.search-select {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  position: relative;
}

.input-wrapper {
  position: relative;
}

.suggestions {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-primary);
  transition: background 0.15s;

  &:hover:not(.disabled) {
    background: var(--el-fill-color-light);
  }

  &.disabled {
    opacity: 0.5;
    cursor: default;
  }
}

.suggestion-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.check-icon {
  margin-left: auto;
  color: var(--el-color-success);
}

.no-results {
  padding: 12px;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  text-align: center;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.chip {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 4px var(--spacing-sm) 4px 4px;
  background: var(--el-fill-color-light);
  border-radius: var(--radius-full);
  border: 1px solid var(--el-border-color-lighter);

  &.locked {
    padding-right: var(--spacing-sm);
  }
}

.chip-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.chip-name {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.chip-remove {
  cursor: pointer;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  transition: color 0.2s;

  &:hover {
    color: var(--el-color-danger);
  }
}
</style>
