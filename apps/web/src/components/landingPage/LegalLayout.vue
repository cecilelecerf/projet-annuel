<script setup lang="ts">
import SiteFooter from './SiteFooter.vue'

defineProps<{
  title: string
}>()
</script>

<template>
  <div class="legal-page">
    <header class="legal-header">
      <div class="container legal-header__inner">
        <router-link to="/" class="brand legal-header__brand">Armali</router-link>
        <router-link to="/" class="legal-header__back">← Retour à l'accueil</router-link>
      </div>
    </header>

    <main class="container legal-content">
      <h1 class="legal-title">{{ title }}</h1>
      <div class="legal-body">
        <slot />
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped lang="scss">
.legal-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 $spacing-2xl;
}

.legal-header {
  padding: $spacing-lg 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.legal-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $spacing-md;
}

.legal-header__brand {
  font-size: 1.25rem;
  color: var(--el-color-primary);
  text-decoration: none;
}

.legal-header__back {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  text-decoration: none;

  &:hover {
    color: var(--el-color-primary);
  }
}

.legal-content {
  flex: 1;
  padding: $spacing-3xl 0;
}

.legal-title {
  font-family: 'Nunito', sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 $spacing-2xl;
}

.legal-body {
  color: var(--el-text-color-regular);
  line-height: 1.7;

  :deep(h2) {
    font-size: 1.25rem;
    font-weight: var(--fw-bold);
    color: var(--el-text-color-primary);
    margin: $spacing-2xl 0 $spacing-sm;
  }

  :deep(h3) {
    font-size: 1.05rem;
    font-weight: var(--fw-bold);
    color: var(--el-text-color-primary);
    margin: $spacing-lg 0 $spacing-xs;
  }

  :deep(p) {
    margin: 0 0 $spacing-md;
  }

  :deep(ul) {
    margin: 0 0 $spacing-md;
    padding-left: 1.5em;
  }

  :deep(li) {
    margin-bottom: $spacing-xs;
  }

  :deep(a) {
    color: var(--el-color-primary);
  }
}

@include below('md') {
  .container {
    padding: 0 $spacing-lg;
  }
}
</style>
