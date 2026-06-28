<template>
  <div class="not-found">
    <div class="not-found__card">
      <div class="not-found__code">404</div>
      <h1 class="not-found__title">Page introuvable</h1>
      <p class="not-found__desc">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <el-button type="primary" @click="$router.push('/')">Retour à l'accueil</el-button>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f8f9fa;
}

.not-found__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.not-found__code {
  font-size: 72px;
  font-weight: 900;
  color: #e5e7eb;
  line-height: 1;
}

.not-found__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.not-found__desc {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
}
</style>
