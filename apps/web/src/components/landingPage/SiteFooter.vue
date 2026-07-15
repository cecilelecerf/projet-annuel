<template>
  <footer class="footer">
    <div class="container footer__inner">
      <span class="brand footer__brand">Armali</span>
      <span class="footer__copy">© 2026 Armali — La santé animale, réinventée</span>
      <div class="footer__links">
        <router-link to="/mentions-legales">Mentions légales</router-link>
        <router-link to="/confidentialite">Confidentialité</router-link>
        <router-link to="/cgu">CGU</router-link>
        <router-link to="/cgv">CGV</router-link>
        <router-link to="/contact">Contact</router-link>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.footer {
  padding: $spacing-xl 0;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 $spacing-2xl;
}

.footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $spacing-md;
}

.footer__brand {
  font-size: 1.25rem;
  color: var(--el-color-primary);
}

.footer__copy {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.footer__links {
  display: flex;
  gap: $spacing-lg;
  flex-wrap: wrap;

  a {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-decoration: none;
    transition: color 0.15s;

    &:hover {
      color: var(--el-color-primary);
    }
  }
}

@include below('md') {
  .container {
    padding: 0 $spacing-lg;
  }

  .footer__inner {
    flex-direction: column;
    text-align: center;
  }
}
</style>
