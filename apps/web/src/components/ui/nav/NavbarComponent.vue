<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'
import Sidebar, { type MenuItem } from './SidebarComponent.vue'
import NotificationMessageItem from './clocks/NotificationMessageItem.vue'
import NotificationStockItem from './clocks/NotificationStockItem.vue'
import { getStringRole } from '@/utils/role.utils'
import type { Conversation, ConversationId, ProductClinicWithProduct } from '@armali/schemas'
import { useNotify } from '@/composables/useNotify'
import { useMessagingStore } from '@/features/messaging/stores/messagingStore'
import { http } from '@/lib/api'
import { productsApi } from '@/features/products/api/products.api'
import { useCartStore } from '@/features/shop/stores/cartStore'

const notify = useNotify()

defineProps<{ menuItems: MenuItem[] }>()

const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const messagingStore = useMessagingStore()
const cartStore = useCartStore()

function goToCart() {
  router.push({ name: 'CLIENT.Cart' })
}

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

// ── Alertes de stock bas (référent / directeur uniquement) ────────────────
const lowStockProducts = ref<ProductClinicWithProduct[]>([])
const readStockIds = ref<Set<string>>(new Set())

const STOCK_ALERT_ROLES = ['REFERENT', 'DIRECTOR']

async function loadStockAlerts() {
  if (!user.value || !STOCK_ALERT_ROLES.includes(user.value.role)) return
  try {
    const clinics = await http.get<{ id: string }[]>('/clinics/me')
    const clinic = clinics[0]
    if (!clinic) return
    lowStockProducts.value = await productsApi.getLowStock(clinic.id)
  } catch {
    /* silencieux : une alerte de stock qui échoue ne doit pas bloquer la navbar */
  }
}

onMounted(loadStockAlerts)

function goToStockAlert(product: ProductClinicWithProduct) {
  readStockIds.value.add(product.id)
  const role = user.value?.role
  router.push({ name: `${role}.Boutique` })
}

// ── Fusion des notifications (messages + stock) pour un rendu unifié ──────

type NotificationItem =
  | { kind: 'message'; key: string; conversation: Conversation }
  | { kind: 'stock'; key: string; product: ProductClinicWithProduct }

const notificationItems = computed<NotificationItem[]>(() => [
  ...unreadConversations.value.map(
    (conversation): NotificationItem => ({
      kind: 'message',
      key: `message-${conversation.id}`,
      conversation,
    }),
  ),
  ...lowStockProducts.value.map(
    (product): NotificationItem => ({
      kind: 'stock',
      key: `stock-${product.id}`,
      product,
    }),
  ),
])

const unreadLowStockCount = computed(
  () => lowStockProducts.value.filter((p) => !readStockIds.value.has(p.id)).length,
)

const totalNotifications = computed(
  () => messagingStore.totalUnread + unreadLowStockCount.value,
)

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
      <el-badge
        v-if="user?.role === 'CLIENT'"
        :value="cartStore.totalItems"
        :hidden="cartStore.totalItems === 0"
        class="navbar__badge"
      >
        <el-button circle plain @click="goToCart">
          <el-icon><ShoppingCart /></el-icon>
        </el-button>
      </el-badge>

      <el-dropdown trigger="click" placement="bottom-end">
        <el-badge
          :value="totalNotifications"
          :hidden="totalNotifications === 0"
          class="navbar__badge"
        >
          <el-button circle plain>
            <el-icon><Bell /></el-icon>
          </el-button>
        </el-badge>

        <template #dropdown>
          <el-dropdown-menu class="navbar__notifications">
            <el-dropdown-item v-if="notificationItems.length === 0" disabled>
              Aucune nouvelle notification
            </el-dropdown-item>

            <!-- Boucle unique sur toutes les notifications (messages + stock),
                 chacune rendue par le composant correspondant à son type -->
            <template v-for="item in notificationItems" :key="item.key">
              <el-dropdown-item
                v-if="item.kind === 'message'"
                @click="goToConversation(item.conversation.id)"
              >
                <NotificationMessageItem
                  :title="conversationTitle(item.conversation)"
                  :preview="item.conversation.lastMessage?.content"
                  :unread-count="item.conversation.unreadCount"
                />
              </el-dropdown-item>

              <el-dropdown-item v-else @click="goToStockAlert(item.product)">
                <NotificationStockItem
                  :product-name="item.product.product.name"
                  :stock="item.product.stock"
                  :minimum-required="item.product.minimumRequired"
                  :unread="!readStockIds.has(item.product.id)"
                />
              </el-dropdown-item>
            </template>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown trigger="click" placement="bottom-end">
        <div class="navbar__user">
          <el-avatar class="navbar__avatar">{{ userInitials }}</el-avatar>
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