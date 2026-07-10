<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useNotify } from '@/composables/useNotify'
import { useAuthStore } from '@/stores/authStore'
import { supplierApi } from '../api/supplier.api'
import { supplierOrderApi } from '@/features/supplier-orders/api/supplier-order.api'
import { budgetApi } from '@/features/budget/api/budget.api'
import { productsApi } from '@/features/products/api/products.api'
import type { SupplierWithProducts, ProductId } from '@armali/schemas'

const notify = useNotify()
const authStore = useAuthStore()

// Catalogue fournisseurs global : seul l'admin peut créer/modifier/supprimer.
// Référent/directeur consultent et passent commande pour leur clinique.
const canManage = computed(() => authStore.user?.role === 'ADMIN')
const canOrder = computed(
  () => authStore.user?.role === 'REFERENT' || authStore.user?.role === 'DIRECTOR',
)

const suppliers = ref<SupplierWithProducts[]>([])
const loading = ref(false)
const expandedId = ref<string | null>(null)
const balance = ref<number | null>(null)

const allProducts = ref<{ id: string; name: string; brand: { name: string } }[]>([])

// Quantités en cours de saisie, par fournisseur puis par produit
const quantities = ref<Record<string, Record<string, number>>>({})

async function load() {
  loading.value = true
  try {
    const calls: Promise<unknown>[] = [supplierApi.getAll()]
    if (canManage.value) calls.push(productsApi.getAll())
    if (canOrder.value) calls.push(budgetApi.get())

    const results = await Promise.all(calls)
    suppliers.value = results[0] as SupplierWithProducts[]
    if (canManage.value) allProducts.value = results[1] as typeof allProducts.value
    if (canOrder.value) {
      const b = (canManage.value ? results[2] : results[1]) as Awaited<
        ReturnType<typeof budgetApi.get>
      >
      balance.value = b.balance
    }
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger les fournisseurs')
  } finally {
    loading.value = false
  }
}
onMounted(load)

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
  if (!quantities.value[id]) quantities.value[id] = {}
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}

// ── Commande (référent/directeur) ────────────────────────────────────────────

function orderTotalFor(supplier: SupplierWithProducts) {
  const qtys = quantities.value[supplier.id] ?? {}
  return supplier.supplierProducts.reduce((sum, sp) => {
    const qty = qtys[sp.productId] ?? 0
    return sum + qty * sp.costPrice
  }, 0)
}

const submittingOrder = ref<string | null>(null)

async function submitOrder(supplier: SupplierWithProducts) {
  const qtys = quantities.value[supplier.id] ?? {}
  const items = Object.entries(qtys)
    .filter(([, qty]) => (qty as number) > 0)
    .map(([productId, quantity]) => ({
      productId: productId as ProductId,
      quantity: quantity as number,
    }))

  if (items.length === 0) {
    notify.error('Indique une quantité pour au moins un produit')
    return
  }

  const total = orderTotalFor(supplier)
  try {
    await ElMessageBox.confirm(
      `Commander pour ${formatCurrency(total)} chez ${supplier.name} ?`,
      'Confirmer la commande',
    )
  } catch {
    return
  }

  submittingOrder.value = supplier.id
  try {
    await supplierOrderApi.create({ supplierId: supplier.id, items })
    notify.success('Commande envoyée au fournisseur')
    quantities.value[supplier.id] = {}
    await load()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de créer la commande')
  } finally {
    submittingOrder.value = null
  }
}

// ── Création / édition fournisseur (admin uniquement) ────────────────────────

const supplierDialogOpen = ref(false)
const editingSupplierId = ref<string | null>(null)
const supplierForm = ref({ name: '', email: '', phone: '', address: '' })
const submittingSupplier = ref(false)

function openCreateSupplier() {
  editingSupplierId.value = null
  supplierForm.value = { name: '', email: '', phone: '', address: '' }
  supplierDialogOpen.value = true
}

function openEditSupplier(s: SupplierWithProducts) {
  editingSupplierId.value = s.id
  supplierForm.value = {
    name: s.name,
    email: s.email ?? '',
    phone: s.phone ?? '',
    address: s.address ?? '',
  }
  supplierDialogOpen.value = true
}

async function submitSupplier() {
  if (!supplierForm.value.name.trim()) {
    notify.error('Le nom est requis')
    return
  }
  submittingSupplier.value = true
  try {
    const payload = {
      name: supplierForm.value.name,
      email: supplierForm.value.email || undefined,
      phone: supplierForm.value.phone || undefined,
      address: supplierForm.value.address || undefined,
    }
    if (editingSupplierId.value) {
      await supplierApi.update(editingSupplierId.value, payload)
      notify.success('Fournisseur modifié')
    } else {
      await supplierApi.create(payload)
      notify.success('Fournisseur créé')
    }
    supplierDialogOpen.value = false
    await load()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Une erreur est survenue')
  } finally {
    submittingSupplier.value = false
  }
}

async function deleteSupplier(s: SupplierWithProducts) {
  try {
    await ElMessageBox.confirm(
      `Supprimer le fournisseur « ${s.name} » ? Cette action est irréversible.`,
      'Confirmation',
      { type: 'warning' },
    )
  } catch {
    return
  }
  try {
    await supplierApi.delete(s.id)
    notify.success('Fournisseur supprimé')
    await load()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de supprimer')
  }
}

// ── Gestion du catalogue produits d'un fournisseur (admin uniquement) ───────

const productDialogOpen = ref(false)
const productDialogSupplierId = ref<string | null>(null)
const productForm = ref({ productId: '', costPrice: 0 })
const submittingProduct = ref(false)

const availableProductsForDialog = computed(() => {
  const supplier = suppliers.value.find(
    (s: SupplierWithProducts) => s.id === productDialogSupplierId.value,
  )
  if (!supplier) return allProducts.value
  const existingIds = new Set(
    supplier.supplierProducts.map(
      (sp: SupplierWithProducts['supplierProducts'][number]) => sp.productId,
    ),
  )
  return allProducts.value.filter(
    (p: { id: string; name: string; brand: { name: string } }) => !existingIds.has(p.id),
  )
})

function openAddProduct(supplierId: string) {
  productDialogSupplierId.value = supplierId
  productForm.value = { productId: '', costPrice: 0 }
  productDialogOpen.value = true
}

async function submitAddProduct() {
  if (!productForm.value.productId) {
    notify.error('Sélectionne un produit')
    return
  }
  submittingProduct.value = true
  try {
    await supplierApi.addProduct(productDialogSupplierId.value!, {
      productId: productForm.value.productId as ProductId,
      costPrice: productForm.value.costPrice,
    })
    notify.success('Produit ajouté au catalogue')
    productDialogOpen.value = false
    await load()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : "Impossible d'ajouter le produit")
  } finally {
    submittingProduct.value = false
  }
}

async function updateProductCost(supplierId: string, linkId: string, newCost: number) {
  try {
    await supplierApi.updateProduct(supplierId, linkId, { costPrice: newCost })
    notify.success('Prix mis à jour')
    await load()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de mettre à jour le prix')
  }
}

async function removeProduct(supplierId: string, linkId: string) {
  try {
    await supplierApi.removeProduct(supplierId, linkId)
    notify.success('Produit retiré du catalogue')
    await load()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de retirer le produit')
  }
}
</script>

<template>
  <div class="page-header">
    <div>
      <h1>Fournisseurs</h1>
      <p v-if="canManage">Gérez le catalogue fournisseurs et leurs prix d'achat</p>
      <p v-else-if="canOrder">Parcourez le catalogue et commandez pour votre clinique</p>
    </div>
    <div class="header-right">
      <span v-if="canOrder && balance !== null" class="balance-pill">
        Budget disponible : <strong>{{ formatCurrency(balance) }}</strong>
      </span>
      <el-button v-if="canManage" type="primary" @click="openCreateSupplier">
        Nouveau fournisseur
      </el-button>
    </div>
  </div>

  <el-skeleton v-if="loading" :rows="4" animated />

  <div v-else-if="suppliers.length === 0" class="empty-state">
    Aucun fournisseur pour le moment.
  </div>

  <div v-else class="supplier-list">
    <div v-for="supplier in suppliers" :key="supplier.id" class="card supplier-card">
      <div class="supplier-header" @click="toggleExpand(supplier.id)">
        <div>
          <strong>{{ supplier.name }}</strong>
          <span class="supplier-meta">
            {{ supplier.supplierProducts.length }} produit(s)
            <template v-if="supplier.email"> · {{ supplier.email }}</template>
            <template v-if="supplier.phone"> · {{ supplier.phone }}</template>
          </span>
        </div>
        <div v-if="canManage" class="supplier-actions" @click.stop>
          <el-button size="small" @click="openEditSupplier(supplier)">Modifier</el-button>
          <el-button size="small" type="danger" plain @click="deleteSupplier(supplier)">
            Supprimer
          </el-button>
        </div>
      </div>

      <div v-if="expandedId === supplier.id" class="supplier-catalog">
        <div class="catalog-header">
          <h3>Catalogue produits</h3>
          <el-button v-if="canManage" size="small" @click="openAddProduct(supplier.id)">
            Ajouter un produit
          </el-button>
        </div>

        <div v-if="supplier.supplierProducts.length === 0" class="no-data">
          Aucun produit dans le catalogue de ce fournisseur.
        </div>

        <table v-else class="catalog-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Marque</th>
              <th>Prix d'achat</th>
              <th v-if="canOrder">Quantité</th>
              <th v-if="canManage"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sp in supplier.supplierProducts" :key="sp.id">
              <td>{{ sp.product.name }}</td>
              <td>{{ sp.product.brand.name }}</td>
              <td>
                <el-input-number
                  v-if="canManage"
                  :model-value="sp.costPrice"
                  :min="0"
                  :precision="2"
                  :step="0.5"
                  size="small"
                  @change="(v: number | undefined) => v !== undefined && updateProductCost(supplier.id, sp.id, v)"
                />
                <span v-else>{{ formatCurrency(sp.costPrice) }}</span>
              </td>
              <td v-if="canOrder">
                <el-input-number
                  v-model="quantities[supplier.id]![sp.productId]"
                  :min="0"
                  :step="1"
                  size="small"
                />
              </td>
              <td v-if="canManage">
                <el-button
                  size="small"
                  type="danger"
                  text
                  @click="removeProduct(supplier.id, sp.id)"
                >
                  Retirer
                </el-button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="canOrder && supplier.supplierProducts.length > 0" class="order-footer">
          <span class="order-total">
            Total : <strong>{{ formatCurrency(orderTotalFor(supplier)) }}</strong>
          </span>
          <el-button
            type="primary"
            :loading="submittingOrder === supplier.id"
            @click="submitOrder(supplier)"
          >
            Commander chez {{ supplier.name }}
          </el-button>
        </div>
      </div>
    </div>
  </div>

  <!-- Dialogs (admin uniquement) -->
  <template v-if="canManage">
    <el-dialog
      v-model="supplierDialogOpen"
      :title="editingSupplierId ? 'Modifier le fournisseur' : 'Nouveau fournisseur'"
      width="480px"
    >
      <el-form label-position="top">
        <el-form-item label="Nom">
          <el-input v-model="supplierForm.name" />
        </el-form-item>
        <el-form-item label="Email">
          <el-input v-model="supplierForm.email" />
        </el-form-item>
        <el-form-item label="Téléphone">
          <el-input v-model="supplierForm.phone" />
        </el-form-item>
        <el-form-item label="Adresse">
          <el-input v-model="supplierForm.address" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="supplierDialogOpen = false">Annuler</el-button>
        <el-button type="primary" :loading="submittingSupplier" @click="submitSupplier">
          {{ editingSupplierId ? 'Enregistrer' : 'Créer' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="productDialogOpen" title="Ajouter un produit au catalogue" width="420px">
      <el-form label-position="top">
        <el-form-item label="Produit">
          <el-select
            v-model="productForm.productId"
            filterable
            placeholder="Choisir un produit"
            style="width: 100%"
          >
            <el-option
              v-for="p in availableProductsForDialog"
              :key="p.id"
              :label="`${p.name} (${p.brand.name})`"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Prix d'achat (€)">
          <el-input-number
            v-model="productForm.costPrice"
            :min="0"
            :precision="2"
            :step="0.5"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialogOpen = false">Annuler</el-button>
        <el-button type="primary" :loading="submittingProduct" @click="submitAddProduct">
          Ajouter
        </el-button>
      </template>
    </el-dialog>
  </template>
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
.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}
.balance-pill {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 6px 12px;
  border-radius: var(--radius-full);
}
.balance-pill strong {
  color: var(--el-color-primary);
}

.empty-state {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  text-align: center;
  padding: var(--spacing-xl);
}

.supplier-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
.supplier-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.supplier-meta {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.supplier-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.supplier-catalog {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--el-border-color-lighter);
}
.catalog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}
.catalog-header h3 {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  margin: 0;
}
.no-data {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.catalog-table {
  width: 100%;
  border-collapse: collapse;
}
.catalog-table th {
  text-align: left;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.catalog-table td {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
}

.order-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--el-border-color-lighter);
}
.order-total {
  font-size: 14px;
  color: var(--el-text-color-primary);
}
</style>