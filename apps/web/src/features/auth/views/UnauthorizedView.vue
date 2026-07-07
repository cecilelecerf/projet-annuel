<template>
  <div class="unauthorized">
    <div class="unauthorized__card">
      <div class="unauthorized__icon">
        <el-icon :size="56"><Lock /></el-icon>
      </div>
      <h1 class="unauthorized__title">Accès non autorisé</h1>
      <p class="unauthorized__desc">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      <el-button type="primary" @click="$router.back()">Retour</el-button>
    </div>
  </div>
</template>

<style scoped>
.unauthorized {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f8f9fa;
}

.unauthorized__card {
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

.unauthorized__icon {
  color: #f56c6c;
}

.unauthorized__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.unauthorized__desc {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
}
</style>
