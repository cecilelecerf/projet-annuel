<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'

defineProps<{
  initial: string
  name: string
  route: RouteLocationRaw
  description?: string
  metas?: string[]
}>()
const router = useRouter()
</script>

<template>
  <div
    class="contact-card"
    role="button"
    tabindex="0"
    @click="router.push(route)"
    @keydown.enter="router.push(route)"
  >
    <div class="body-card">
      <div class="contact-avatar">
        {{ initial }}
      </div>

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
      </div>
    </div>

    <div class="contact-action">
      Voir plus <el-icon class="contact-action-icon"><ArrowRight /></el-icon>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.contact-card {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xl);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  width: fit-content;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.15s;

  &:hover,
  &:focus-visible {
    border-color: var(--el-color-primary-light-5);
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
  @include below('sm') {
    width: 100%;
    flex-direction: row;
  }
  @include above('lg') {
    width: 100%;
  }
}

.body-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-direction: column;
  @include below('sm') {
    flex-direction: row;
    width: 100%;
  }
  @include above('lg') {
    flex-direction: column;
  }
}

.contact-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: var(--fw-bold);
  flex-shrink: 0;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  @include below('sm') {
    text-align: start;
  }
}

.contact-description {
  font-size: 12px;
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
  gap: 4px var(--spacing-sm);
  margin-top: 2px;
}

.contact-meta {
  font-size: 11px;
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
}

.contact-action-icon {
  font-size: 16px;
  color: var(--el-text-color-placeholder);
  transition: all 0.15s;
}
</style>
