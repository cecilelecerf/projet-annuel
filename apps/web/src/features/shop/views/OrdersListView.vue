<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { ordersApi } from '@/features/shop/api/orders.api'
import { useCartStore } from '@/features/shop/stores/cartStore'
import type { OrderWithItems, OrderStatus } from '@armali/schemas'

const route = useRoute()
const notify = useNotify()
const cart = useCartStore()

const orders = ref<OrderWithItems[]>([])
const loading = ref(false)

const statusLabel: Record<OrderStatus, string> = {
  PENDING: 'En attente de paiement',
  CONFIRMED: 'Confirmée',
  READY: 'Prête à récupérer',
  PICKED_UP: 'Récupérée',
  CANCELLED: 'Annulée',
}
const statusTag: Record<OrderStatus, string> = {
  PENDING: 'warning',
  CONFIRMED: 'primary',
  READY: 'success',
  PICKED_UP: 'info',
  CANCELLED: 'danger',
}

async function load() {
  loading.value = true
  try {
    orders.value = await ordersApi.getMine()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger vos commandes')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.query.checkout === 'success') {
    cart.clear()
    notify.success('Paiement confirmé, merci pour votre commande !')
  }
  load()
})
</script>

<template>
  <div class="page-header">
    <h1>Mes commandes</h1>
  </div>

  <el-skeleton v-if="loading" :rows="6" animated />

  <div v-else-if="orders.length === 0" class="no-data">Aucune commande pour le moment.</div>

  <div v-else class="orders-list">
    <div v-for="order in orders" :key="order.id" class="card order-card">
      <div class="order-card__header">
        <div>
          <strong>{{ order.clinic.name }}</strong>
          <span class="order-date">{{ new Date(order.createdAt).toLocaleDateString('fr-FR') }}</span>
        </div>
        <el-tag :type="statusTag[order.status] as any">{{ statusLabel[order.status] }}</el-tag>
      </div>
      <div v-for="item in order.orderItems" :key="item.id" class="order-item">
        <span>{{ item.quantity }} × {{ item.productClinic.product.name }}</span>
        <strong>{{ (item.unitPrice * item.quantity).toFixed(2) }} €</strong>
      </div>
      <div v-if="order.pickupCode" class="pickup-code">
        <span class="pickup-code__label">Code de retrait à donner à la clinique</span>
        <span class="pickup-code__value">{{ order.pickupCode }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  margin-bottom: var(--spacing-lg);
}
.page-header h1 {
  font-size: 24px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}
.no-data {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: var(--spacing-3xl) 0;
}
.orders-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
.order-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}
.order-date {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.order-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  padding: 4px 0;
}
.pickup-code {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}
.pickup-code__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.pickup-code__value {
  font-size: 24px;
  font-weight: var(--fw-bold);
  letter-spacing: 4px;
  color: var(--el-color-primary);
}
</style>