<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
export type Color = 'purple' | 'orange' | 'teal' | 'indigo' | 'pink' | 'yellow'
const props = withDefaults(
  defineProps<{
    name: string
    route?: RouteLocationRaw
    description?: string
    metas?: string[]
    actionLabel?: string
    direction?: 'row' | 'column'
    badge?: { label: string; color?: string }
    color?: Color
    avatarUrl?: string | null
  }>(),
  {
    actionLabel: 'Voir plus',
    direction: 'row',
  },
)
const router = useRouter()

const AVATAR_PALETTE: Record<Color, { bg: string; fg: string }> = {
  purple: { bg: 'var(--el-color-purple-light-7)', fg: 'var(--el-color-purple)' },
  orange: { bg: 'var(--el-color-orange-light-7)', fg: 'var(--el-color-orange)' },
  teal: { bg: 'var(--el-color-teal-light-7)', fg: 'var(--el-color-teal)' },
  indigo: { bg: 'var(--el-color-indigo-light-7)', fg: 'var(--el-color-indigo)' },
  pink: { bg: 'var(--el-color-pink-light-7)', fg: 'var(--el-color-pink)' },
  yellow: { bg: 'var(--el-color-yellow-light-7)', fg: 'var(--el-color-yellow)' },
}

const avatarColor = computed(() => {
  if (props.color) return AVATAR_PALETTE[props.color]
  const hash = [...props.name].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const palette = Object.values(AVATAR_PALETTE)
  return palette[hash % palette.length]
})

const initial = computed(() => {
  const parts = props.name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase()
  return `${parts[0]?.charAt(0)}${parts[parts.length - 1]?.charAt(0)}`.toUpperCase()
})

const badgeColor = computed(() => props.badge?.color ?? 'var(--el-color-primary)')
</script>

<template>
  <div
    class="contact-card"
    :class="`contact-card--${direction} contact-card-selectable-${!!route}`"
    role="button"
    tabindex="0"
    @click="route && router.push(route)"
    @keydown.enter="route && router.push(route)"
  >
    <span
      v-if="badge"
      class="contact-badge"
      :style="{
        background: `color-mix(in srgb, ${badgeColor} 10%, white)`,
        color: `color-mix(in srgb, ${badgeColor} 10%, dark)`,
      }"
    >
      {{ badge.label }}
    </span>

    <div
      class="contact-avatar"
      :style="!avatarUrl ? { background: avatarColor!.bg, color: avatarColor!.fg } : {}"
    >
      <img v-if="avatarUrl" :src="avatarUrl" :alt="name" class="contact-avatar-img" />
      <template v-else>{{ initial }}</template>
    </div>
    <div class="body-card">
      <div class="contact-info">
        <p class="contact-name">
          {{ name }}
        </p>
        <p class="contact-description" v-if="description">
          {{ description }}
        </p>
        <div class="contact-metas" v-if="metas && metas.length > 0">
          <span class="contact-meta" v-for="(value, i) in metas" :key="i">
            {{ value }}
          </span>
        </div>

        <div class="contact-action" v-if="route">
          {{ actionLabel }} <el-icon class="contact-action-icon"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.contact-card {
  display: flex;
  position: relative; // ancre le badge
  border-radius: var(--radius-lg);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s ease;
  overflow: hidden;
  padding: var(--spacing-xs);
  &.contact-card-selectable-true {
    cursor: pointer;

    &:hover,
    &:focus-visible {
      border-color: var(--el-border-color);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      transform: translateY(-1px);
    }

    &:hover .contact-action-icon,
    &:focus-visible .contact-action-icon {
      transform: translateX(3px);
      color: var(--el-color-primary);
    }

    &:focus-visible {
      outline: 2px solid var(--el-color-primary-light-5);
      outline-offset: 2px;
    }
  }
}

.contact-badge {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  z-index: 1;
  padding: var(--spacing-2xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  white-space: nowrap;
  line-height: 1.4;
}

.contact-card--row {
  flex-direction: row;

  .contact-avatar {
    width: 90px;
    height: auto;
    align-self: stretch;
    font-size: var(--fs-2xl);
  }
}

.contact-card--column {
  flex-direction: column;

  .contact-avatar {
    width: 100%;
    height: 120px;
    font-size: 32px;
  }
}

.body-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
  min-width: 0;
  flex: 1;
  padding: var(--spacing-lg);
}

.contact-avatar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--fw-bold);
  border-radius: var(--radius-md);
  overflow: hidden; // nécessaire pour que l'img respecte le border-radius
}
.contact-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-size: var(--fs-lg);
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: start;
}

.contact-description {
  font-size: var(--fs-sm);
  color: var(--el-text-color-secondary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-metas {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-2xs) var(--spacing-sm);
  margin-top: 2px;
}

.contact-meta {
  font-size: var(--fs-xs);
  color: var(--el-text-color-placeholder);

  &:not(:last-child)::after {
    content: '·';
    margin-left: var(--spacing-sm);
    color: var(--el-border-color);
  }
}

.contact-action {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-2xs);
  font-size: var(--fs-base);
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.contact-action-icon {
  font-size: var(--fs-xl);
  color: var(--el-text-color-placeholder);
  transition: all 0.15s;
}
</style>
