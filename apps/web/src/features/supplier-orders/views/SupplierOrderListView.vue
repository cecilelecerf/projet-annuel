<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useNotify } from '@/composables/useNotify'
import { supplierOrderApi } from '../api/supplier-order.api'
import { supplierApi } from '@/features/suppliers/api/supplier.api'
import { budgetApi } from '@/features/budget/api/budget.api'
import type {
  SupplierOrderWithDetails,
  SupplierOrderStatus,
  SupplierWithProducts,
  CreateSupplierOrder,
  ProductId,
} from '@armali/schemas'

const notify = useNotify()

const orders = ref<SupplierOrderWithDetails[]>([])
const suppliers = ref<SupplierWithProducts[]>([])
const balance = ref<number | null>(null)
const loading = ref(false)
const statusFilter = ref<SupplierOrderStatus | 'ALL'>('ALL')

async function load() {
  loading.value = true
  try {
    const [o, s, b] = await Promise.all([
      supplierOrderApi.getAll(statusFilter.value === 'ALL' ? undefined : statusFilter.value),
      supplierApi.getAll(),
      budgetApi.get(),
    ])
    orders.value = o
    suppliers.value = s
    balance.value = b.balance
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger les commandes')
  } finally {
    loading.value = false
  }
}
onMounted(load)

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const statusConfig = {
  PENDING: { label: 'En attente', tag: 'warning' as const },
  RECEIVED: { label: 'Reçue', tag: 'success' as const },
  CANCELLED: { label: 'Annulée', tag: 'info' as const },
}

// ── Actions sur une commande ─────────────────────────────────────────────────

async function receiveOrder(order: SupplierOrderWithDetails) {
  try {
    await ElMessageBox.confirm(
      `Confirmer la réception de la commande chez ${order.supplier.name} ? Le stock sera mis à jour automatiquement.`,
      'Confirmer la réception',
    )
  } catch {
    return
  }
  try {
    await supplierOrderApi.markReceived(order.id)
    notify.success('Commande marquée comme reçue, stock mis à jour')
    await load()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de marquer la commande reçue')
  }
}

async function cancelOrder(order: SupplierOrderWithDetails) {
  try {
    await ElMessageBox.confirm(
      `Annuler cette commande ? ${formatCurrency(order.total)} seront recrédités au budget.`,
      "Confirmer l'annulation",
      { type: 'warning' },
    )
  } catch {
    return
  }
  try {
    await supplierOrderApi.cancel(order.id)
    notify.success('Commande annulée, budget recrédité')
    await load()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : "Impossible d'annuler la commande")
  }
}

// ── Création d'une commande ──────────────────────────────────────────────────

const createDialogOpen = ref(false)
const selectedSupplierId = ref('')
const quantities = ref<Record<string, number>>({})
const submitting = ref(false)

const selectedSupplier = computed(() =>
  suppliers.value.find((s: SupplierWithProducts) => s.id === selectedSupplierId.value) ?? null,
)

const orderTotal = computed(() => {
  if (!selectedSupplier.value) return 0
  return selectedSupplier.value.supplierProducts.reduce(
    (sum: number, sp: SupplierWithProducts['supplierProducts'][number]) => {
      const qty = quantities.value[sp.productId] ?? 0
      return sum + qty * sp.costPrice
    },
    0,
  )
})

function openCreateDialog() {
  selectedSupplierId.value = ''
  quantities.value = {}
  createDialogOpen.value = true
}

function onSupplierChange() {
  quantities.value = {}
}

async function submitOrder() {
  if (!selectedSupplier.value) {
    notify.error('Sélectionne un fournisseur')
    return
  }
  const entries = Object.entries(quantities.value) as [string, number][]
  const items: CreateSupplierOrder['items'] = entries
    .filter(([, qty]) => qty > 0)
    .map(([productId, quantity]) => ({
      productId: productId as ProductId,
      quantity,
    }))

  if (items.length === 0) {
    notify.error('Ajoute au moins un produit avec une quantité')
    return
  }

  submitting.value = true
  try {
    await supplierOrderApi.create({ supplierId: selectedSupplier.value.id, items })
    notify.success('Commande fournisseur créée')
    createDialogOpen.value = false
    await load()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de créer la commande')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page-header">
    <div>
      <h1>Commandes fournisseurs</h1>
      <p v-if="balance !== null">
        Budget disponible : <strong>{{ formatCurrency(balance) }}</strong>
      </p>
    </div>
    <el-button type="primary" @click="openCreateDialog">Nouvelle commande</el-button>
  </div>

  <el-radio-group v-model="statusFilter" class="status-filter" @change="load">
    <el-radio-button value="ALL">Toutes</el-radio-button>
    <el-radio-button value="PENDING">En attente</el-radio-button>
    <el-radio-button value="RECEIVED">Reçues</el-radio-button>
    <el-radio-button value="CANCELLED">Annulées</el-radio-button>
  </el-radio-group>

  <el-skeleton v-if="loading" :rows="4" animated />

  <div v-else-if="orders.length === 0" class="empty-state">Aucune commande.</div>

  <div v-else class="order-list">
    <div v-for="order in orders" :key="order.id" class="card order-card">
      <div class="order-header">
        <div>
          <strong>{{ order.supplier.name }}</strong>
          <span class="order-date">{{ formatDate(order.createdAt) }}</span>
        </div>
        <el-tag :type="statusConfig[order.status].tag">{{ statusConfig[order.status].label }}</el-tag>
      </div>

      <div class="order-items">
        <span v-for="item in order.items" :key="item.id" class="order-item">
          {{ item.quantity }}× {{ item.product.name }}
        </span>
      </div>

      <div class="order-footer">
        <span class="order-total">{{ formatCurrency(order.total) }}</span>
        <div v-if="order.status === 'PENDING'" class="order-actions">
          <el-button size="small" type="danger" plain @click="cancelOrder(order)">Annuler</el-button>
          <el-button size="small" type="success" @click="receiveOrder(order)">Marquer reçue</el-button>
        </div>
      </div>
    </div>
  </div>

  <!-- Dialog nouvelle commande -->
  <el-dialog v-model="createDialogOpen" title="Nouvelle commande fournisseur" width="560px">
    <el-form label-position="top">
      <el-form-item label="Fournisseur">
        <el-select
          v-model="selectedSupplierId"
          placeholder="Choisir un fournisseur"
          style="width: 100%"
          @change="onSupplierChange"
        >
          <el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>

      <template v-if="selectedSupplier">
        <div v-if="selectedSupplier.supplierProducts.length === 0" class="no-data">
          Ce fournisseur n'a aucun produit dans son catalogue. Ajoute des prix d'achat depuis la
          page Fournisseurs avant de commander.
        </div>
        <div v-else class="quantity-list">
          <div
            v-for="sp in selectedSupplier.supplierProducts"
            :key="sp.id"
            class="quantity-row"
          >
            <div class="quantity-info">
              <strong>{{ sp.product.name }}</strong>
              <span class="quantity-cost">{{ formatCurrency(sp.costPrice) }} / unité</span>
            </div>
            <el-input-number
              v-model="quantities[sp.productId]"
              :min="0"
              :step="1"
              size="small"
            />
          </div>
        </div>

        <div class="order-total-preview">
          Total : <strong>{{ formatCurrency(orderTotal) }}</strong>
        </div>
      </template>
    </el-form>
    <template #footer>
      <el-button @click="createDialogOpen = false">Annuler</el-button>
      <el-button type="primary" :loading="submitting" @click="submitOrder">Commander</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
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

.status-filter {
  margin-bottom: var(--spacing-md);
}

.empty-state {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  text-align: center;
  padding: var(--spacing-xl);
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}
.order-date {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.order-items {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}
.order-item {
  font-size: 12px;
  background: var(--el-fill-color-light);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  color: var(--el-text-color-regular);
}
.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--el-border-color-lighter);
}
.order-total {
  font-weight: var(--fw-bold);
  font-size: 16px;
  color: var(--el-text-color-primary);
}
.order-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.no-data {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin: var(--spacing-md) 0;
}
.quantity-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: 300px;
  overflow-y: auto;
}
.quantity-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.quantity-info {
  display: flex;
  flex-direction: column;
}
.quantity-cost {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.order-total-preview {
  margin-top: var(--spacing-md);
  text-align: right;
  font-size: 15px;
  color: var(--el-text-color-primary);
}
</style>