<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useNotify } from '@/composables/useNotify'
import { ordersApi } from '@/features/shop/api/orders.api'
import type { OrderWithClient } from '@armali/schemas'

const notify = useNotify()

const orders = ref<OrderWithClient[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    orders.value = await ordersApi.getClinicOrders()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger les commandes')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const toPrepare = computed(() => orders.value.filter((o) => o.status === 'CONFIRMED'))
const readyForPickup = computed(() => orders.value.filter((o) => o.status === 'READY'))

// ── Préparation d'une commande ─────────────────────────────────────────────

const preparingId = ref<string | null>(null)

async function markReady(order: OrderWithClient) {
  preparingId.value = order.id
  try {
    await ordersApi.markReady(order.id)
    notify.success('Commande marquée comme prête')
    await load()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la préparation')
  } finally {
    preparingId.value = null
  }
}

// ── Remise via le code donné par le client ─────────────────────────────────

const pickupCode = ref('')
const deliverLoading = ref(false)
const deliveredOrder = ref<OrderWithClient | null>(null)

async function submitPickupCode() {
  if (!pickupCode.value.trim()) return
  deliverLoading.value = true
  deliveredOrder.value = null
  try {
    const order = await ordersApi.deliver({ pickupCode: pickupCode.value.trim() })
    deliveredOrder.value = order
    notify.success('Commande remise avec succès')
    pickupCode.value = ''
    await load()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Code invalide ou commande non trouvée')
  } finally {
    deliverLoading.value = false
  }
}
</script>

<template>
  <div class="page-header">
    <h1>Retrait des commandes</h1>
    <p>Préparez les commandes payées et remettez les colis aux clients</p>
  </div>

  <!-- Saisie du code de retrait -->
  <div class="card pickup-card">
    <h2>Remettre un colis</h2>
    <div class="pickup-form">
      <el-input
        v-model="pickupCode"
        placeholder="Code de retrait (ex: A1B2C3)"
        size="large"
        style="text-transform: uppercase"
        @keyup.enter="submitPickupCode"
      />
      <el-button
        type="primary"
        size="large"
        :loading="deliverLoading"
        @click="submitPickupCode"
      >
        Valider la remise
      </el-button>
    </div>

    <div v-if="deliveredOrder" class="delivered-confirmation">
      <el-icon class="success-icon"><CircleCheck /></el-icon>
      <div>
        <strong>
          {{ deliveredOrder.client.firstname }} {{ deliveredOrder.client.lastname }}
        </strong>
        <span class="delivered-items">
          {{ deliveredOrder.orderItems.map((i) => `${i.quantity} × ${i.productClinic.product.name}`).join(', ') }}
        </span>
      </div>
    </div>
  </div>

  <!-- Commandes à préparer -->
  <div class="card">
    <h2>À préparer ({{ toPrepare.length }})</h2>
    <div v-if="loading" class="loading-state">Chargement...</div>
    <div v-else-if="toPrepare.length === 0" class="no-data">Aucune commande à préparer.</div>
    <div v-else class="order-list">
      <div v-for="order in toPrepare" :key="order.id" class="order-row">
        <div class="order-row__info">
          <strong>{{ order.client.firstname }} {{ order.client.lastname }}</strong>
          <span class="order-row__items">
            {{ order.orderItems.map((i) => `${i.quantity} × ${i.productClinic.product.name}`).join(', ') }}
          </span>
        </div>
        <el-button
          type="primary"
          size="small"
          :loading="preparingId === order.id"
          @click="markReady(order)"
        >
          Marquer comme prête
        </el-button>
      </div>
    </div>
  </div>

  <!-- Commandes prêtes, en attente de retrait -->
  <div class="card">
    <h2>Prêtes à récupérer ({{ readyForPickup.length }})</h2>
    <div v-if="loading" class="loading-state">Chargement...</div>
    <div v-else-if="readyForPickup.length === 0" class="no-data">
      Aucune commande en attente de retrait.
    </div>
    <div v-else class="order-list">
      <div v-for="order in readyForPickup" :key="order.id" class="order-row">
        <div class="order-row__info">
          <strong>{{ order.client.firstname }} {{ order.client.lastname }}</strong>
          <span class="order-row__items">
            {{ order.orderItems.map((i) => `${i.quantity} × ${i.productClinic.product.name}`).join(', ') }}
          </span>
        </div>
        <el-tag type="success">En attente du code</el-tag>
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
  margin: 0 0 var(--spacing-xs);
}
.page-header p {
  color: var(--el-text-color-secondary);
  margin: 0;
  font-size: 14px;
}
.card {
  margin-bottom: var(--spacing-md);
}
.card h2 {
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-md);
}
.pickup-form {
  display: flex;
  gap: var(--spacing-sm);
}
.pickup-form .el-input {
  flex: 1;
}
.delivered-confirmation {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm);
  background: var(--el-color-success-light-9);
  border-radius: var(--radius-sm);
}
.success-icon {
  font-size: 24px;
  color: var(--el-color-success);
}
.delivered-items {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.order-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.order-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.order-row:last-child {
  border-bottom: none;
}
.order-row__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.order-row__items {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.no-data,
.loading-state {
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  padding: var(--spacing-md) 0;
}
</style>