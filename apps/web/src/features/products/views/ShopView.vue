<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { http } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'
import { productsApi } from '@/features/products/api/products.api'
import { brandsApi } from '@/features/products/api/brands.api'
import type { ProductClinicWithProduct, Brand, BrandId, ClinicId } from '@armali/schemas'

const notify = useNotify()

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
    const clinic = await http.get<Clinic>('/clinics/me')
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

// ── Ajout d'un nouveau produit ──────────────────────────────────────────

const CREATE_PREFIX = '__create__:'

const brandOptions = ref<Brand[]>([])
const brandSearchLoading = ref(false)
const brandCreating = ref(false)

async function searchBrands(query: string) {
  if (!query) {
    brandOptions.value = []
    return
  }
  brandSearchLoading.value = true
  try {
    brandOptions.value = await brandsApi.search(query)
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la recherche de marque')
  } finally {
    brandSearchLoading.value = false
  }
}

// true si aucune marque existante ne correspond exactement à la saisie
const showCreateBrandOption = computed(() => {
  const query = brandQuery.value.trim()
  if (!query) return false
  return !brandOptions.value.some((b) => b.name.toLowerCase() === query.toLowerCase())
})

const brandQuery = ref('')

// Déclenché quand l'utilisateur sélectionne une marque existante OU l'option "Créer..."
async function handleBrandSelect(value: string) {
  if (!value.startsWith(CREATE_PREFIX)) {
    addForm.brandId = value
    return
  }
  const name = value.slice(CREATE_PREFIX.length)
  brandCreating.value = true
  try {
    const brand = await brandsApi.create(name)
    brandOptions.value = [brand, ...brandOptions.value]
    addForm.brandId = brand.id
    notify.success(`Marque "${brand.name}" créée`)
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la création de la marque')
    addForm.brandId = ''
  } finally {
    brandCreating.value = false
  }
}

const addDialog = ref(false)
const addForm = reactive({
  name: '',
  description: '',
  brandId: '',
  stock: 0,
  minimumRequired: 1,
  price: 0,
})
const addLoading = ref(false)

function resetAddForm() {
  addForm.name = ''
  addForm.description = ''
  addForm.brandId = ''
  addForm.stock = 0
  addForm.minimumRequired = 1
  addForm.price = 0
  brandOptions.value = []
  brandQuery.value = ''
}

async function submitAddProduct() {
  if (!clinicId.value) return
  if (addForm.brandId.startsWith(CREATE_PREFIX) || brandCreating.value) {
    notify.error('Merci de patienter, la marque est en cours de création')
    return
  }
  addLoading.value = true
  try {
    // NOTE : addForm.brandId et clinicId.value sont de simples `string` côté formulaire,
    // alors que les schémas Zod attendent des ID "brandés" (BrandId, ClinicId).
    // On caste explicitement à la frontière, la validation réelle a lieu côté serveur.
    const product = await productsApi.create({
      name: addForm.name,
      description: addForm.description || undefined,
      brandId: addForm.brandId as BrandId,
    })
    const clinicProduct = await productsApi.createClinicProduct({
      clinicId: clinicId.value as ClinicId,
      productId: product.id,
      stock: addForm.stock,
      minimumRequired: addForm.minimumRequired,
      price: addForm.price,
    })
    clinicProducts.value.unshift(clinicProduct)
    notify.success('Produit ajouté avec succès')
    addDialog.value = false
    resetAddForm()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : "Erreur lors de l'ajout du produit")
  } finally {
    addLoading.value = false
  }
}

// ── Réapprovisionnement ──────────────────────────────────────────────────

const restockDialog = ref(false)
const restockTarget = ref<ProductClinicWithProduct | null>(null)
const restockQuantity = ref(1)
const restockLoading = ref(false)

function openRestock(item: ProductClinicWithProduct) {
  restockTarget.value = item
  restockQuantity.value = 1
  restockDialog.value = true
}

async function submitRestock() {
  if (!restockTarget.value) return
  restockLoading.value = true
  try {
    const updated = await productsApi.restock(restockTarget.value.id, {
      quantity: restockQuantity.value,
    })
    const index = clinicProducts.value.findIndex((p) => p.id === updated.id)
    if (index !== -1) clinicProducts.value[index] = updated
    notify.success('Stock mis à jour')
    restockDialog.value = false
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors du réapprovisionnement')
  } finally {
    restockLoading.value = false
  }
}

// ── Modification du minimum requis / prix ───────────────────────────────

const editDialog = ref(false)
const editTarget = ref<ProductClinicWithProduct | null>(null)
const editForm = reactive({ name: '', brandId: '', minimumRequired: 0, price: 0 })
const editLoading = ref(false)

const editBrandOptions = ref<Brand[]>([])
const editBrandQuery = ref('')
const editBrandSearchLoading = ref(false)
const editBrandCreating = ref(false)

async function searchEditBrands(query: string) {
  if (!query) return
  editBrandSearchLoading.value = true
  try {
    editBrandOptions.value = await brandsApi.search(query)
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la recherche de marque')
  } finally {
    editBrandSearchLoading.value = false
  }
}

const showCreateEditBrandOption = computed(() => {
  const query = editBrandQuery.value.trim()
  if (!query) return false
  return !editBrandOptions.value.some((b) => b.name.toLowerCase() === query.toLowerCase())
})

async function handleEditBrandSelect(value: string) {
  if (!value.startsWith(CREATE_PREFIX)) {
    editForm.brandId = value
    return
  }
  const name = value.slice(CREATE_PREFIX.length)
  editBrandCreating.value = true
  try {
    const brand = await brandsApi.create(name)
    editBrandOptions.value = [brand, ...editBrandOptions.value]
    editForm.brandId = brand.id
    notify.success(`Marque "${brand.name}" créée`)
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la création de la marque')
  } finally {
    editBrandCreating.value = false
  }
}

function openEdit(item: ProductClinicWithProduct) {
  editTarget.value = item
  editForm.name = item.product.name
  editForm.brandId = item.product.brandId
  editForm.minimumRequired = item.minimumRequired
  editForm.price = item.price
  // Préremplit la liste pour que le select affiche déjà le nom de la marque actuelle
  editBrandOptions.value = [item.product.brand]
  editBrandQuery.value = ''
  editDialog.value = true
}

async function submitEdit() {
  if (!editTarget.value) return
  if (editForm.brandId.startsWith(CREATE_PREFIX) || editBrandCreating.value) {
    notify.error('Merci de patienter, la marque est en cours de création')
    return
  }
  editLoading.value = true
  try {
    const [updatedProduct, updatedClinicProduct] = await Promise.all([
      productsApi.update(editTarget.value.productId, {
        name: editForm.name,
        brandId: editForm.brandId as BrandId,
      }),
      productsApi.updateClinicProduct(editTarget.value.id, {
        minimumRequired: editForm.minimumRequired,
        price: editForm.price,
      }),
    ])
    const index = clinicProducts.value.findIndex((p) => p.id === updatedClinicProduct.id)
    if (index !== -1) {
      clinicProducts.value[index] = { ...updatedClinicProduct, product: updatedProduct }
    }
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
      <el-button type="primary" @click="addDialog = true">Ajouter un produit</el-button>
    </div>

    <el-alert
      v-if="lowStockCount > 0"
      :title="`${lowStockCount} produit(s) sous le seuil minimum`"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom: 20px"
    />

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

      <el-table-column label="Actions" width="240">
        <template #default="{ row }: { row: ProductClinicWithProduct }">
          <el-button size="small" @click="openRestock(row)">Réapprovisionner</el-button>
          <el-button size="small" @click="openEdit(row)">Modifier</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Dialog : ajout d'un nouveau produit -->
    <el-dialog v-model="addDialog" title="Ajouter un produit" width="480px">
      <el-form label-position="top" @submit.prevent="submitAddProduct">
        <el-form-item label="Nom du produit">
          <el-input v-model="addForm.name" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="addForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="Marque">
          <el-select
            v-model="addForm.brandId"
            filterable
            remote
            :remote-method="
              (q: string) => {
                brandQuery = q
                searchBrands(q)
              }
            "
            :loading="brandSearchLoading || brandCreating"
            placeholder="Rechercher ou créer une marque..."
            style="width: 100%"
            @change="handleBrandSelect"
          >
            <el-option
              v-for="brand in brandOptions"
              :key="brand.id"
              :label="brand.name"
              :value="brand.id"
            />
            <el-option
              v-if="showCreateBrandOption"
              :key="`create-${brandQuery}`"
              :label="`+ Créer la marque « ${brandQuery} »`"
              :value="`${CREATE_PREFIX}${brandQuery}`"
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
      <template #footer>
        <el-button @click="addDialog = false">Annuler</el-button>
        <el-button
          type="primary"
          :loading="addLoading"
          :disabled="brandCreating"
          @click="submitAddProduct"
        >
          Ajouter
        </el-button>
      </template>
    </el-dialog>

    <!-- Dialog : réapprovisionnement -->
    <el-dialog v-model="restockDialog" title="Réapprovisionner" width="360px">
      <p v-if="restockTarget">{{ restockTarget.product.name }}</p>
      <el-form label-position="top" @submit.prevent="submitRestock">
        <el-form-item label="Quantité à ajouter">
          <el-input-number v-model="restockQuantity" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="restockDialog = false">Annuler</el-button>
        <el-button type="primary" :loading="restockLoading" @click="submitRestock">
          Valider
        </el-button>
      </template>
    </el-dialog>

    <!-- Dialog : modification produit + minimum requis / prix -->
    <el-dialog v-model="editDialog" title="Modifier le produit" width="480px">
      <el-form label-position="top" @submit.prevent="submitEdit">
        <el-form-item label="Nom du produit">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="Marque">
          <el-select
            v-model="editForm.brandId"
            filterable
            remote
            :remote-method="
              (q: string) => {
                editBrandQuery = q
                searchEditBrands(q)
              }
            "
            :loading="editBrandSearchLoading || editBrandCreating"
            placeholder="Rechercher ou créer une marque..."
            style="width: 100%"
            @change="handleEditBrandSelect"
          >
            <el-option
              v-for="brand in editBrandOptions"
              :key="brand.id"
              :label="brand.name"
              :value="brand.id"
            />
            <el-option
              v-if="showCreateEditBrandOption"
              :key="`create-${editBrandQuery}`"
              :label="`+ Créer la marque « ${editBrandQuery} »`"
              :value="`${CREATE_PREFIX}${editBrandQuery}`"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Minimum requis">
          <el-input-number v-model="editForm.minimumRequired" :min="0" />
        </el-form-item>
        <el-form-item label="Prix (€)">
          <el-input-number v-model="editForm.price" :min="0" :precision="2" :step="0.5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog = false">Annuler</el-button>
        <el-button
          type="primary"
          :loading="editLoading"
          :disabled="editBrandCreating"
          @click="submitEdit"
        >
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
</style>
