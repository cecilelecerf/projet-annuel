<script setup lang="ts">
import type { UserRole } from '@armali/schemas'
import { ROLE_THEME } from '../utils/roleTheme'

const props = defineProps<{
  firstname?: string
  lastname?: string
  role: UserRole
}>()

const theme = ROLE_THEME[props.role]
</script>

<template>
  <div class="profil-header">
    <div class="profil-avatar" :style="{ background: theme.avatarBg, color: theme.avatarColor }">
      {{ firstname?.[0] }}{{ lastname?.[0] }}
    </div>
    <div>
      <h1 class="profil-name">{{ firstname }} {{ lastname }}</h1>
      <span class="profil-role" :style="{ background: theme.badgeBg, color: theme.badgeColor }">
        {{ theme.label }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profil-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
}
.profil-avatar {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-3xl);
  font-weight: var(--fw-bold);
  flex-shrink: 0;
}
.profil-name {
  font-size: var(--fs-4xl);
  font-weight: var(--fw-bold);
  margin: 0 0 var(--spacing-xs);
}
.profil-role {
  border-radius: var(--radius-md);
  padding: 2px 10px;
  font-size: var(--fs-base);
  font-weight: var(--fw-medium);
}
</style>
