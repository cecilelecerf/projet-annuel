<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import { roleHomeMap } from '@/router/index'

const authStore = useAuthStore()
const router = useRouter()

function goToMySpace() {
  const role = authStore.user?.role
  if (role) router.push(roleHomeMap[role])
  else router.push('/login')
}
</script>

<template>
  <section class="hero">
    <div class="hero__bg"></div>

    <nav class="nav">
      <span class="nav__logo brand">Armali</span>
      <div class="nav__actions">
        <template v-if="!authStore.isAuthenticated">
          <el-button round plain @click="router.push('/login')">Se connecter</el-button>
          <el-button type="primary" round @click="router.push('/register')">Inscription</el-button>
        </template>
        <template v-else>
          <el-button type="primary" round @click="goToMySpace()">Mon espace →</el-button>
        </template>
      </div>
    </nav>

    <div class="hero__content">
      <div class="hero__badge">
        <span class="hero__badge-dot"></span>
        La santé animale, réinventée
      </div>
      <h1 class="hero__title">
        Votre vétérinaire,<br />
        <span class="hero__title--accent">quand vous en avez besoin</span>
      </h1>
      <p class="hero__subtitle">
        Prenez rendez-vous avec les meilleurs vétérinaires près de chez vous.<br />
        Simple, rapide, pour tous vos compagnons.
      </p>
      <div class="hero__cta">
        <el-button type="primary" size="large" round>Prendre rendez-vous</el-button>
        <el-button size="large" round plain>Trouver un vétérinaire</el-button>
      </div>

      <div class="hero__stats">
        <div class="hero__stat">
          <span class="hero__stat-number">2 400+</span>
          <span class="hero__stat-label">Vétérinaires</span>
        </div>
        <div class="hero__stat-divider"></div>
        <div class="hero__stat">
          <span class="hero__stat-number">48h</span>
          <span class="hero__stat-label">Délai moyen</span>
        </div>
        <div class="hero__stat-divider"></div>
        <div class="hero__stat">
          <span class="hero__stat-number">98%</span>
          <span class="hero__stat-label">Satisfaction</span>
        </div>
      </div>
    </div>

    <div class="hero__animals">
      <span class="animal animal--1">🐕</span>
      <span class="animal animal--2">🐈</span>
      <span class="animal animal--3">🐇</span>
      <span class="animal animal--4">🦜</span>
      <span class="animal animal--5">🐠</span>
    </div>
  </section>
</template>

<style scoped lang="scss">
/* ─── Nav ─── */
.nav {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-2xl);
}

.nav__logo {
  font-size: 1.75rem;
  color: var(--el-color-primary);
}

.nav__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* ─── Hero ─── */
.hero {
  position: relative;
  overflow: hidden;
  min-height: 90vh;
  display: flex;
  flex-direction: column;
}

.hero__bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-color-primary-light-9) 50%,
    var(--el-color-primary-light-7) 100%
  );
  z-index: 0;
}

.hero__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-2xl) var(--spacing-2xl);
  gap: var(--spacing-lg);
  flex: 1;
  justify-content: center;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 50%, transparent);
  color: var(--el-color-primary);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: var(--el-font-size-extra-small);
  font-weight: var(--fw-bold);
  animation: fadeUp 0.6s ease both;
}

.hero__badge-dot {
  width: 6px;
  height: 6px;
  background: var(--el-color-primary);
  border-radius: var(--radius-full);
  animation: pulse 2s ease-in-out infinite;
}

.hero__title {
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: var(--fw-bold);
  line-height: 1.1;
  letter-spacing: -0.02em;
  animation: fadeUp 0.6s ease 0.1s both;
  margin: 0;
}

.hero__title--accent {
  color: var(--el-color-primary);
}

.hero__subtitle {
  font-size: var(--el-font-size-large);
  color: var(--el-text-color-secondary);
  max-width: 520px;
  line-height: 1.6;
  animation: fadeUp 0.6s ease 0.2s both;
  margin: 0;
}

.hero__cta {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  justify-content: center;
  animation: fadeUp 0.6s ease 0.3s both;
}

.hero__stats {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
  margin-top: var(--spacing-md);
  animation: fadeUp 0.6s ease 0.4s both;
}

.hero__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.hero__stat-number {
  font-family: 'Nunito', sans-serif;
  font-size: 2rem;
  font-weight: var(--fw-bold);
  color: var(--el-color-primary);
}

.hero__stat-label {
  font-size: var(--el-font-size-extra-small);
  font-weight: var(--fw-medium);
  color: var(--el-text-color-secondary);
}

.hero__stat-divider {
  width: 1px;
  height: 40px;
  background: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}

/* ─── Floating Animals ─── */
.hero__animals {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.animal {
  position: absolute;
  font-size: 2rem;
  opacity: 0.6;
}

.animal--1 {
  top: 20%;
  left: 8%;
  animation: floatAnimal 7s ease-in-out infinite;
}
.animal--2 {
  top: 35%;
  right: 6%;
  animation: floatAnimal 9s ease-in-out infinite 1s;
}
.animal--3 {
  top: 65%;
  left: 5%;
  animation: floatAnimal 8s ease-in-out infinite 2s;
}
.animal--4 {
  top: 15%;
  right: 12%;
  animation: floatAnimal 11s ease-in-out infinite 0.5s;
}
.animal--5 {
  top: 70%;
  right: 8%;
  animation: floatAnimal 6s ease-in-out infinite 1.5s;
}

/* ─── Animations ─── */
@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(20px, -20px) scale(1.05);
  }
  66% {
    transform: translate(-10px, 15px) scale(0.95);
  }
}

@keyframes floatAnimal {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-16px) rotate(5deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ─── Responsive ─── */
@include below('md') {
  .nav {
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .hero__content {
    padding: var(--spacing-2xl) var(--spacing-lg);
    gap: var(--spacing-md);
  }

  .hero__stats {
    gap: var(--spacing-lg);
  }

  .animal {
    display: none;
  }
}
</style>
