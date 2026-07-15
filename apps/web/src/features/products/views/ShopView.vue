<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'
import { useAuthStore } from '@/stores/authStore'
import { productsApi } from '@/features/products/api/products.api'
import { brandsApi } from '@/features/products/api/brands.api'
import { productRequestsApi } from '@/features/products/api/product-requests.api'
import type {
  ProductClinicWithProduct,
  ProductWithBrand,
  Brand,
  BrandId,
  ClinicId,
  ProductId,
} from '@armali/schemas'

const notify = useNotify()
const router = useRouter()
const authStore = useAuthStore()

// La page est partagée référent/directeur — le lien vers Fournisseurs doit
// pointer vers le bon router selon le rôle connecté.
const suppliersRouteName = computed(() =>
  authStore.user?.role === 'DIRECTOR' ? 'DIRECTOR.Suppliers' : 'REFERENT.Suppliers',
)

interface Clinic {
  id: string
  name: string
}

const clinicId = ref<string | null>(null)
const clinicProducts = ref<ProductClinicWithProduct[]>([])
const loading = ref(false)

// ── Chargement ───────────────────────────────────────────────────────────

async function loadClinicAndProducts() {
  loading.value = true
  try {
    const clinics = await http.get<Clinic[]>('/clinics/me')
    const clinic = clinics[0]
    if (!clinic) {
      notify.error('Aucune clinique associée à ce compte')
      return
    }
    clinicId.value = clinic.id
    clinicProducts.value = await productsApi.getClinicProducts(clinic.id)
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger la boutique')
  } finally {
    loading.value = false
  }
}

onMounted(loadClinicAndProducts)

function isLowStock(item: ProductClinicWithProduct) {
  return item.stock <= item.minimumRequired
}

const lowStockCount = computed(() => clinicProducts.value.filter(isLowStock).length)

// ── Ajout : sélection d'un produit existant du catalogue ─────────────────

const addDialog = ref(false)
const catalogProducts = ref<ProductWithBrand[]>([])
const catalogLoading = ref(false)

// IDs déjà présents dans la boutique de la clinique, pour ne pas proposer de doublon
const alreadyLinkedProductIds = computed(
  () => new Set(clinicProducts.value.map((cp: ProductClinicWithProduct) => cp.productId)),
)

async function openAddDialog() {
  addDialog.value = true
  addForm.productId = ''
  addForm.stock = 0
  addForm.minimumRequired = 1
  addForm.price = 0
  catalogLoading.value = true
  try {
    catalogProducts.value = await productsApi.getAll()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger le catalogue')
  } finally {
    catalogLoading.value = false
  }
}

const availableCatalogProducts = computed(() =>
  catalogProducts.value.filter((p: ProductWithBrand) => !alreadyLinkedProductIds.value.has(p.id)),
)

const addForm = reactive({
  productId: '',
  stock: 0,
  minimumRequired: 1,
  price: 0,
})
const addLoading = ref(false)

async function submitAddProduct() {
  if (!clinicId.value || !addForm.productId) return
  addLoading.value = true
  try {
    const clinicProduct = await productsApi.createClinicProduct({
      clinicId: clinicId.value as ClinicId,
      productId: addForm.productId as ProductId,
      stock: addForm.stock,
      minimumRequired: addForm.minimumRequired,
      price: addForm.price,
    })
    clinicProducts.value.unshift(clinicProduct)
    notify.success('Produit ajouté avec succès')
    addDialog.value = false
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : "Erreur lors de l'ajout du produit")
  } finally {
    addLoading.value = false
  }
}

// ── Demande d'un nouveau produit (absent du catalogue) ────────────────────

const requestDialog = ref(false)
const requestForm = reactive({
  name: '',
  description: '',
  brandId: '',
  newBrandName: '',
  picture: '',
})
const requestLoading = ref(false)

const REQUEST_NEW_BRAND_PREFIX = '__new__:'

const requestBrandOptions = ref<Brand[]>([])
const requestBrandQuery = ref('')
const requestBrandSearchLoading = ref(false)

async function searchRequestBrands(query: string) {
  requestBrandQuery.value = query
  if (!query) {
    requestBrandOptions.value = []
    return
  }
  requestBrandSearchLoading.value = true
  try {
    requestBrandOptions.value = await brandsApi.search(query)
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la recherche de marque')
  } finally {
    requestBrandSearchLoading.value = false
  }
}

// true si aucune marque existante ne correspond exactement à la saisie
const showNewBrandOption = computed(() => {
  const query = requestBrandQuery.value.trim()
  if (!query) return false
  return !requestBrandOptions.value.some((b: Brand) => b.name.toLowerCase() === query.toLowerCase())
})

// Sélection d'une marque existante OU indication d'un nom de marque libre
// (aucune création réelle ici : la marque sera résolue par l'admin à l'approbation)
function handleRequestBrandSelect(value: string) {
  if (value.startsWith(REQUEST_NEW_BRAND_PREFIX)) {
    requestForm.brandId = ''
    requestForm.newBrandName = value.slice(REQUEST_NEW_BRAND_PREFIX.length)
  } else {
    requestForm.brandId = value
    requestForm.newBrandName = ''
  }
}

function openRequestDialog() {
  requestForm.name = ''
  requestForm.description = ''
  requestForm.brandId = ''
  requestForm.newBrandName = ''
  requestForm.picture = ''
  requestBrandOptions.value = []
  requestBrandQuery.value = ''
  addDialog.value = false
  requestDialog.value = true
}

async function submitRequest() {
  if (!requestForm.name.trim()) {
    notify.error('Le nom du produit est requis')
    return
  }
  if (!requestForm.brandId && !requestForm.newBrandName.trim()) {
    notify.error('Merci de choisir une marque existante ou d’en indiquer une nouvelle')
    return
  }
  requestLoading.value = true
  try {
    await productRequestsApi.create({
      name: requestForm.name,
      description: requestForm.description || undefined,
      picture: requestForm.picture || undefined,
      brandId: requestForm.brandId ? (requestForm.brandId as BrandId) : undefined,
      newBrandName: requestForm.newBrandName || undefined,
    })
    notify.success('Votre demande a été envoyée à l’administrateur')
    requestDialog.value = false
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : "Erreur lors de l'envoi de la demande")
  } finally {
    requestLoading.value = false
  }
}

// ── Modification du minimum requis / prix (le nom et la marque du produit ──
// ── appartiennent au catalogue global, géré par l'admin uniquement) ────────

const editDialog = ref(false)
const editTarget = ref<ProductClinicWithProduct | null>(null)
const editForm = reactive({ minimumRequired: 0, price: 0 })
const editLoading = ref(false)

function openEdit(item: ProductClinicWithProduct) {
  editTarget.value = item
  editForm.minimumRequired = item.minimumRequired
  editForm.price = item.price
  editDialog.value = true
}

async function submitEdit() {
  if (!editTarget.value) return
  editLoading.value = true
  try {
    const updated = await productsApi.updateClinicProduct(editTarget.value.id, {
      minimumRequired: editForm.minimumRequired,
      price: editForm.price,
    })
    const index = clinicProducts.value.findIndex((p: ProductClinicWithProduct) => p.id === updated.id)
    if (index !== -1) clinicProducts.value[index] = updated
    notify.success('Produit mis à jour')
    editDialog.value = false
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
  } finally {
    editLoading.value = false
  }
}
</script>

<template>
  <div class="boutique-page">
    <div class="page-header">
      <div>
        <h1>Boutique</h1>
        <p>Gérez le catalogue et le stock de votre clinique</p>
      </div>
      <el-button type="primary" @click="openAddDialog">Ajouter un produit</el-button>
    </div>

    <el-alert
      v-if="lowStockCount > 0"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom: 20px"
    >
      <template #title>
        {{ lowStockCount }} produit(s) sous le seuil minimum —
        <RouterLink :to="{ name: suppliersRouteName }">passer une commande fournisseur</RouterLink>
      </template>
    </el-alert>

    <el-table v-loading="loading" :data="clinicProducts" style="width: 100%">
      <el-table-column label="Produit" min-width="200">
        <template #default="{ row }: { row: ProductClinicWithProduct }">
          <div class="product-cell">
            <strong>{{ row.product.name }}</strong>
            <span class="brand">{{ row.product.brand.name }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Stock" width="140">
        <template #default="{ row }: { row: ProductClinicWithProduct }">
          <el-tag :type="isLowStock(row) ? 'danger' : 'success'">
            {{ row.stock }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="Minimum requis" width="140">
        <template #default="{ row }: { row: ProductClinicWithProduct }">
          {{ row.minimumRequired }}
        </template>
      </el-table-column>

      <el-table-column label="Prix" width="120">
        <template #default="{ row }: { row: ProductClinicWithProduct }">
          {{ row.price }} €
        </template>
      </el-table-column>

      <el-table-column label="Actions" width="260">
        <template #default="{ row }: { row: ProductClinicWithProduct }">
          <el-button
            size="small"
            :type="isLowStock(row) ? 'warning' : 'default'"
            @click="router.push({ name: suppliersRouteName })"
          >
            Commander
          </el-button>
          <el-button size="small" @click="openEdit(row)">Modifier</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Dialog : ajouter un produit existant du catalogue -->
    <el-dialog v-model="addDialog" title="Ajouter un produit" width="480px">
      <el-form label-position="top" @submit.prevent="submitAddProduct">
        <el-form-item label="Produit du catalogue">
          <el-select
            v-model="addForm.productId"
            filterable
            :loading="catalogLoading"
            placeholder="Rechercher un produit..."
            style="width: 100%"
          >
            <el-option
              v-for="product in availableCatalogProducts"
              :key="product.id"
              :label="`${product.name} — ${product.brand.name}`"
              :value="product.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Stock initial">
          <el-input-number v-model="addForm.stock" :min="0" />
        </el-form-item>
        <el-form-item label="Minimum requis">
          <el-input-number v-model="addForm.minimumRequired" :min="0" />
        </el-form-item>
        <el-form-item label="Prix (€)">
          <el-input-number v-model="addForm.price" :min="0" :precision="2" :step="0.5" />
        </el-form-item>
      </el-form>
      <div class="request-link">
        Le produit que vous cherchez n'est pas dans le catalogue ?
        <el-button text type="primary" @click="openRequestDialog">Faire une demande</el-button>
      </div>
      <template #footer>
        <el-button @click="addDialog = false">Annuler</el-button>
        <el-button
          type="primary"
          :loading="addLoading"
          :disabled="!addForm.productId"
          @click="submitAddProduct"
        >
          Ajouter
        </el-button>
      </template>
    </el-dialog>

    <!-- Dialog : demande d'un nouveau produit (soumise à validation admin) -->
    <el-dialog v-model="requestDialog" title="Demander un nouveau produit" width="480px">
      <p class="request-hint">
        Votre demande sera envoyée à l'administrateur, qui l'ajoutera au catalogue s'il l'accepte.
      </p>
      <el-form label-position="top" @submit.prevent="submitRequest">
        <el-form-item label="Nom du produit">
          <el-input v-model="requestForm.name" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="requestForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="Marque">
          <el-select
            :model-value="requestForm.brandId || (requestForm.newBrandName ? `${REQUEST_NEW_BRAND_PREFIX}${requestForm.newBrandName}` : '')"
            filterable
            remote
            :remote-method="searchRequestBrands"
            :loading="requestBrandSearchLoading"
            placeholder="Rechercher une marque ou en proposer une nouvelle..."
            style="width: 100%"
            @change="handleRequestBrandSelect"
          >
            <el-option
              v-for="brand in requestBrandOptions"
              :key="brand.id"
              :label="brand.name"
              :value="brand.id"
            />
            <el-option
              v-if="showNewBrandOption"
              :key="`new-${requestBrandQuery}`"
              :label="`+ Proposer la marque « ${requestBrandQuery} »`"
              :value="`${REQUEST_NEW_BRAND_PREFIX}${requestBrandQuery}`"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Photo (URL, optionnel)">
          <el-input v-model="requestForm.picture" placeholder="https://..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="requestDialog = false">Annuler</el-button>
        <el-button type="primary" :loading="requestLoading" @click="submitRequest">
          Envoyer la demande
        </el-button>
      </template>
    </el-dialog>

    <!-- Dialog : modification du minimum requis / prix -->
    <el-dialog v-model="editDialog" title="Modifier le produit" width="360px">
      <p v-if="editTarget">{{ editTarget.product.name }}</p>
      <el-form label-position="top" @submit.prevent="submitEdit">
        <el-form-item label="Minimum requis">
          <el-input-number v-model="editForm.minimumRequired" :min="0" />
        </el-form-item>
        <el-form-item label="Prix (€)">
          <el-input-number v-model="editForm.price" :min="0" :precision="2" :step="0.5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog = false">Annuler</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">
          Enregistrer
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
}
.page-header h1 {
  font-size: var(--fs-3xl);
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-xs);
}
.page-header p {
  color: var(--el-text-color-secondary);
  margin: 0;
  font-size: var(--fs-md);
}
.product-cell {
  display: flex;
  flex-direction: column;
}
.product-cell .brand {
  font-size: var(--fs-sm);
  color: var(--el-text-color-secondary);
}
.request-link {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: var(--spacing-sm);
}
.request-hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0 0 var(--spacing-md);
}
</style>