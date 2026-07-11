<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'
import { RouterLink, useRouter } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { roleHomeMap } from '@/router'

const router = useRouter()
const notify = useNotify()

interface Role {
  key: string
  label: string
  emoji: string
  description: string
  email: string
}

const roles: Role[] = [
  {
    key: 'client',
    label: 'Client',
    emoji: '👤',
    description: "Propriétaire d'animaux, gestion des RDV",
    email: 'client@gmail.com',
  },
  {
    key: 'veterinaire',
    label: 'Vétérinaire',
    emoji: '🩺',
    description: 'Consultation, agenda et dossiers patients',
    email: 'veto@gmail.com',
  },
  {
    key: 'secretaire',
    label: 'Secrétaire',
    emoji: '📋',
    description: 'Gestion des plannings et accueil',
    email: 'secretaire@gmail.com',
  },
  {
    key: 'directeur',
    label: 'Directeur de clinique',
    emoji: '🏥',
    description: 'Supervision de la clinique et équipes',
    email: 'directeur@gmail.com',
  },
  {
    key: 'referent',
    label: 'Référent',
    emoji: '⭐',
    description: 'Coordination inter-cliniques et spécialités',
    email: 'referent@gmail.com',
  },
  // {
  //   key: 'superadmin',
  //   label: 'Super Admin',
  //   emoji: '🔐',
  //   description: 'Accès complet à toute la plateforme',
  //   email: 'admin@gmail.com',

  // },
]
const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)

const handleLogin = async ({ email }: { email: string }) => {
  await authStore.login(email, 'Password123!')
}
const loginAs = async (role: Role) => {
  await handleLogin({ email: role.email })
  notify.success(`Connexion en tant que ${role.label}`)
  const userRole = authStore.user?.role
  if (userRole) router.push(roleHomeMap[userRole])
}
</script>

<template>
  <section class="dev-section">
    <div class="dev-section__header">
      <div class="dev-section__badge">
        <el-icon>
          <Monitor />
        </el-icon>
        DEV MODE
      </div>
      <h2 class="dev-section__title">Accès rapide par rôle</h2>
      <p class="dev-section__subtitle">Connectez-vous directement avec un compte de test</p>
    </div>
    <div v-if="isAuthenticated" class="dev-section__grid">
      <RouterLink v-if="authStore.user" :to="roleHomeMap[authStore.user.role]">
        Allez sur mon espace
      </RouterLink>
      <el-button @click="authStore.logout()">Déconnexion</el-button>
    </div>
    <div v-else class="dev-section__grid">
      <div
        v-for="role in roles"
        :key="role.key"
        class="role-card"
        :class="`role-card--${role.key}`"
        @click="loginAs(role)"
      >
        <div class="role-card__icon">{{ role.emoji }}</div>
        <div class="role-card__content">
          <h3 class="role-card__title">{{ role.label }}</h3>
          <p class="role-card__desc">{{ role.description }}</p>
          <span class="role-card__email">{{ role.email }}</span>
        </div>
        <div class="role-card__arrow">
          <el-icon><Right /></el-icon>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.dev-section {
  position: relative;
  background: var(--el-color-primary-dark-9);
  padding: var(--spacing-3xl) var(--spacing-2xl);
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 39px,
        color-mix(in srgb, var(--el-color-primary-light-5) 5%, transparent) 39px,
        color-mix(in srgb, var(--el-color-primary-light-5) 5%, transparent) 40px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 39px,
        color-mix(in srgb, var(--el-color-primary-light-5) 5%, transparent) 39px,
        color-mix(in srgb, var(--el-color-primary-light-5) 5%, transparent) 40px
      );
  }
}

.dev-section__header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.dev-section__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: color-mix(in srgb, var(--el-color-primary-light-3) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-primary-light-3) 40%, transparent);
  color: var(--el-color-primary-light-5);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: var(--el-font-size-extra-small);
  font-weight: var(--fw-bold);
  margin-bottom: var(--spacing-md);
  font-family: 'Nunito', sans-serif;
}

.dev-section__title {
  font-size: var(--el-font-size-extra-large);
  font-weight: var(--fw-bold);
  color: var(--el-color-white);
  margin: 0 0 var(--spacing-sm);
}

.dev-section__subtitle {
  font-size: var(--el-font-size-base);
  color: var(--el-color-info);
  margin: 0;
}

.dev-section__grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-md);
  max-width: 1100px;
  margin: 0 auto;
}

.role-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 40%, transparent);
    transform: translateY(-2px);
    box-shadow: 0 var(--spacing-sm) var(--spacing-2xl) rgba(0, 0, 0, 0.3);

    &::before {
      opacity: 1;
    }
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-color-primary) 15%, transparent),
      transparent
    );
    opacity: 0;
    transition: opacity 0.2s ease;
  }
}

.role-card:hover .role-card__arrow {
  transform: translateX(4px);
  color: var(--el-color-primary-light-3);
}

.role-card__icon {
  font-size: 2rem;
  flex-shrink: 0;
  filter: drop-shadow(0 2px var(--spacing-sm) rgba(0, 0, 0, 0.3));
}

.role-card__content {
  flex: 1;
  min-width: 0;
}

.role-card__title {
  font-family: 'Nunito', sans-serif;
  font-size: var(--el-font-size-medium);
  font-weight: var(--fw-bold);
  color: var(--el-color-white);
  margin: 0 0 var(--spacing-xs);
}

.role-card__desc {
  font-size: var(--el-font-size-small);
  color: rgba(255, 255, 255, 0.45);
  margin: 0 0 var(--spacing-sm);
}

.role-card__email {
  font-size: var(--el-font-size-extra-small);
  color: var(--el-color-primary-light-3);
  font-family: 'DM Mono', monospace;
}

.role-card__arrow {
  color: rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

@include below('md') {
  .dev-section {
    padding: var(--spacing-2xl) var(--spacing-lg);
  }

  .dev-section__grid {
    grid-template-columns: 1fr;
  }
}
</style>
