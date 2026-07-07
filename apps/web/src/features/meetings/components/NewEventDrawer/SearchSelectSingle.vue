<!-- SearchSelectSingle.vue -->
<script setup lang="ts" generic="T extends { id: string }">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: T | null
  items: T[]
  placeholder?: string
  displayKey: keyof T
  secondaryKey?: keyof T
  locked?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: T | null]
}>()

const search = ref('')
const focused = ref(false)

const filtered = computed(() => {
  if (!focused.value || props.modelValue) return []
  if (search.value.length < 2) return []
  const q = search.value.toLowerCase()
  return props.items.filter((item) => {
    const primary = String(item[props.displayKey]).toLowerCase()
    const secondary = props.secondaryKey ? String(item[props.secondaryKey]).toLowerCase() : ''
    return primary.includes(q) || secondary.includes(q)
  })
})

const getLabel = (item: T) => {
  const primary = String(item[props.displayKey])
  const secondary = props.secondaryKey ? String(item[props.secondaryKey]) : ''
  return secondary ? `${primary} ${secondary}` : primary
}

const getInitial = (item: T) => getLabel(item).charAt(0).toUpperCase()

const select = (item: T) => {
  emit('update:modelValue', item)
  search.value = ''
  focused.value = false
}

const clear = () => {
  emit('update:modelValue', null)
  search.value = ''
}

const onInput = (val: string) => {
  if (props.modelValue) emit('update:modelValue', null)
  search.value = val
}
</script>

<template>
  <div class="search-select-single" v-click-outside="() => (focused = false)">
    <div class="input-wrapper" :class="{ 'has-value': !!modelValue, locked }">
      <div v-if="modelValue" class="selected-avatar">
        {{ getInitial(modelValue) }}
      </div>

      <input
        class="input"
        :value="modelValue ? getLabel(modelValue) : search"
        :placeholder="placeholder ?? 'Rechercher...'"
        :readonly="locked || !!modelValue"
        :class="{ 'has-avatar': !!modelValue }"
        @input="(e) => onInput((e.target as HTMLInputElement).value)"
        @focus="focused = true"
      />

      <el-icon v-if="modelValue && !locked" class="clear-btn" @click.stop="clear">
        <Close />
      </el-icon>
      <el-icon v-else-if="!modelValue" class="search-icon">
        <Search />
      </el-icon>
    </div>

    <div v-if="filtered.length > 0" class="suggestions">
      <div
        v-for="item in filtered"
        :key="item.id"
        class="suggestion-item"
        @mousedown.prevent="select(item)"
      >
        <div class="suggestion-avatar">{{ getInitial(item) }}</div>
        <span>{{ getLabel(item) }}</span>
      </div>
    </div>

    <div v-else-if="focused && search.length >= 2 && !modelValue" class="no-results">
      Aucun résultat
    </div>
  </div>
</template>

<style lang="scss" scoped>
.search-select-single {
  position: relative;
}

.input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid var(--el-border-color);
  border-radius: var(--radius-full);
  background: var(--el-bg-color);
  height: 40px;
  padding: 0 12px;
  gap: 8px;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: var(--el-color-primary);
  }

  &.locked {
    background: var(--el-fill-color-lighter);
    cursor: default;
  }
}

.selected-avatar {
  width: 22px;
  height: 22px;
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

.input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--el-text-color-primary);

  &::placeholder {
    color: var(--el-text-color-placeholder);
  }

  &.has-avatar {
    font-weight: 500;
  }
}

.clear-btn {
  cursor: pointer;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
  flex-shrink: 0;
  transition: color 0.2s;

  &:hover {
    color: var(--el-color-danger);
  }
}

.search-icon {
  color: var(--el-text-color-placeholder);
  font-size: 14px;
  flex-shrink: 0;
}

.suggestions {
  z-index: 1;
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
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-primary);
  transition: background 0.15s;

  &:hover {
    background: var(--el-fill-color-light);
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

.no-results {
  z-index: 1;
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  padding: 12px;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  text-align: center;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-md);
}
</style>
