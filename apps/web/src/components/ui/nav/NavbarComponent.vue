<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'
import Sidebar from './SidebarComponent.vue'
import { getStringRole } from '@/utils/role.utils'
import type { Conversation, ConversationId } from '@armali/schemas'
import { useNotify } from '@/composables/useNotify'
import { useMessagingStore } from '@/features/messaging/stores/messagingStore'
import type { NavNode } from './NaveNode.ts'

const notify = useNotify()

defineProps<{ menuItems: NavNode[] }>()

const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const messagingStore = useMessagingStore()

const unreadConversations = computed(() =>
  messagingStore.sortedConversations.filter((c) => (c.unreadCount ?? 0) > 0).slice(0, 5),
)

function conversationTitle(conversation: Conversation) {
  if (conversation.type === 'GROUP') return conversation.name ?? 'Groupe'
  const other = conversation.conversationMembers?.find((m) => m.userId !== user.value?.id)
  return other?.user ? `${other.user.firstname} ${other.user.lastname}` : 'Conversation'
}

function goToConversation(conversationId: ConversationId) {
  const role = user.value?.role
  messagingStore.openConversation(conversationId)
  router.push({ name: `${role?.toUpperCase()}.Messagerie` })
}

const userInitials = computed(() => {
  if (!user.value) return '?'
  return `${user.value.firstname[0]}${user.value.lastname[0]}`.toUpperCase()
})

const handleLogout = async () => {
  await authStore.logout()
  notify.success('Déconnexion réussie')
  router.push('/')
}
</script>

<template>
  <header class="navbar">
    <div class="navbar__left">
      <Sidebar :menu-items="menuItems" />
      <h1 class="navbar__title">Espace {{ user && getStringRole(user.role) }}</h1>
    </div>
    <div class="navbar__right">
      <el-dropdown trigger="click" placement="bottom-end">
        <el-badge
          :value="messagingStore.totalUnread"
          :hidden="messagingStore.totalUnread === 0"
          class="navbar__badge"
        >
          <el-button circle plain>
            <el-icon><Bell /></el-icon>
          </el-button>
        </el-badge>

        <template #dropdown>
          <el-dropdown-menu class="navbar__notifications">
            <el-dropdown-item v-if="unreadConversations.length === 0" disabled>
              Aucune nouvelle notification
            </el-dropdown-item>
            <!-- Passer toutes les items (sotcks+conversations), boucler dessus -->
            <el-dropdown-item
              v-for="conversation in unreadConversations"
              :key="conversation.id"
              @click="goToConversation(conversation.id)"
            >
              <!-- En fonction du type -->
              <!-- <ItemMessageNotif/>-->
              <!-- <ItemStockNotif/>-->
              <!-- Avec la possiblité de rajouter d'autr item notif au besoin
                -->
              <div class="navbar__notif-item">
                <div class="navbar__notif-top">
                  <strong>{{ conversationTitle(conversation) }}</strong>
                  <el-badge :value="conversation.unreadCount" />
                </div>
                <span class="navbar__notif-preview">{{ conversation.lastMessage?.content }}</span>
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown trigger="click" placement="bottom-end">
        <div class="navbar__user">
          <el-avatar class="navbar__avatar" :src="user?.avatarUrl ?? undefined">
            <template v-if="!user?.avatarUrl">{{ userInitials }}</template>
          </el-avatar>
          <Transition name="fade">
            <div v-if="user" class="navbar__user-info">
              <span class="navbar__user-name">{{ user.firstname }} {{ user.lastname }}</span>
              <span class="navbar__user-role">{{ user && getStringRole(user.role) }}</span>
            </div>
          </Transition>
          <el-icon class="navbar__chevron"><ArrowDown /></el-icon>
        </div>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="router.push({ name: `${user?.role?.toUpperCase()}.Profil` })">
              <el-icon><User /></el-icon>
              Mon profil
            </el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout()">
              <el-icon><SwitchButton /></el-icon>
              Déconnexion
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped lang="scss">
$navbar-height: 64px;

.navbar {
  height: $navbar-height;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-xl);
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.navbar__title {
  font-size: var(--el-font-size-large);
  font-weight: 900;
  color: var(--el-color-primary);
  margin: 0;
}

.navbar__left,
.navbar__right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.navbar__badge {
  :deep(.el-badge__content) {
    background: var(--el-color-primary);
  }
}

.navbar__notifications {
  min-width: 260px;
}

.navbar__notif-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 260px;
}

.navbar__notif-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.navbar__notif-preview {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navbar__user {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-lg);
  transition: background 0.15s ease;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.navbar__avatar {
  background: color-mix(in srgb, var(--el-color-primary) 20%, transparent) !important;
  color: var(--el-color-primary) !important;
  font-weight: var(--fw-bold);
  font-size: var(--el-font-size-small);
  flex-shrink: 0;
}

.navbar__user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.navbar__user-name {
  font-size: var(--el-font-size-small);
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}

.navbar__user-role {
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-secondary);
}

.navbar__chevron {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

@include below('md') {
  .navbar__user-info {
    display: none;
  }
}
</style>
