<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useNotify } from '@/composables/useNotify'
import { productsApi } from '@/features/products/api/products.api'
import { brandsApi } from '@/features/products/api/brands.api'
import type { ProductWithBrand, Brand, BrandId } from '@armali/schemas'

const notify = useNotify()

const products = ref<ProductWithBrand[]>([])
const loading = ref(false)

async function loadProducts() {
  loading.value = true
  try {
    products.value = await productsApi.getAll()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger le catalogue')
  } finally {
    loading.value = false
  }
}

onMounted(loadProducts)

const searchQuery = ref('')
const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return products.value
  return products.value.filter(
    (p) => p.name.toLowerCase().includes(query) || p.brand.name.toLowerCase().includes(query),
  )
})

// ── Création d'un nouveau produit ─────────────────────────────────────────

const CREATE_PREFIX = '__create__:'

const createDialog = ref(false)
const createForm = reactive({
  name: '',
  description: '',
  brandId: '',
  websiteUrl: '',
  picture: '',
})
const createLoading = ref(false)

const brandOptions = ref<Brand[]>([])
const brandQuery = ref('')
const brandSearchLoading = ref(false)
const brandCreating = ref(false)

async function searchBrands(query: string) {
  brandQuery.value = query
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

const showCreateBrandOption = computed(() => {
  const query = brandQuery.value.trim()
  if (!query) return false
  return !brandOptions.value.some((b) => b.name.toLowerCase() === query.toLowerCase())
})

async function handleBrandSelect(value: string) {
  if (!value.startsWith(CREATE_PREFIX)) {
    createForm.brandId = value
    return
  }
  const name = value.slice(CREATE_PREFIX.length)
  brandCreating.value = true
  try {
    const brand = await brandsApi.create(name)
    brandOptions.value = [brand, ...brandOptions.value]
    createForm.brandId = brand.id
    notify.success(`Marque "${brand.name}" créée`)
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la création de la marque')
    createForm.brandId = ''
  } finally {
    brandCreating.value = false
  }
}

function openCreateDialog() {
  createForm.name = ''
  createForm.description = ''
  createForm.brandId = ''
  createForm.websiteUrl = ''
  createForm.picture = ''
  brandOptions.value = []
  brandQuery.value = ''
  createDialog.value = true
}

async function submitCreate() {
  if (!createForm.name.trim() || !createForm.brandId) {
    notify.error('Le nom et la marque sont requis')
    return
  }
  if (createForm.brandId.startsWith(CREATE_PREFIX) || brandCreating.value) {
    notify.error('Merci de patienter, la marque est en cours de création')
    return
  }
  createLoading.value = true
  try {
    const product = await productsApi.create({
      name: createForm.name,
      description: createForm.description || undefined,
      brandId: createForm.brandId as BrandId,
      websiteUrl: createForm.websiteUrl || undefined,
      picture: createForm.picture || undefined,
    })
    products.value.unshift(product)
    notify.success('Produit ajouté au catalogue')
    createDialog.value = false
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : "Erreur lors de la création du produit")
  } finally {
    createLoading.value = false
  }
}
</script>

<template>
  <div class="page-header">
    <div>
      <h1>Catalogue produits</h1>
      <p>Gérez le catalogue global des produits vendables par les cliniques</p>
    </div>
    <el-button type="primary" @click="openCreateDialog">+ Nouveau produit</el-button>
  </div>

  <div class="card">
    <el-input
      v-model="searchQuery"
      placeholder="Rechercher un produit ou une marque..."
      clearable
      style="margin-bottom: 16px; max-width: 360px"
    />

    <el-table v-loading="loading" :data="filteredProducts" style="width: 100%">
      <el-table-column label="Produit" min-width="220">
        <template #default="{ row }: { row: ProductWithBrand }">
          <div class="product-cell">
            <strong>{{ row.name }}</strong>
            <span v-if="row.description" class="desc">{{ row.description }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Marque" width="180">
        <template #default="{ row }: { row: ProductWithBrand }">
          {{ row.brand.name }}
        </template>
      </el-table-column>
      <el-table-column label="Site web" min-width="180">
        <template #default="{ row }: { row: ProductWithBrand }">
          <a v-if="row.websiteUrl" :href="row.websiteUrl" target="_blank" rel="noopener">
            {{ row.websiteUrl }}
          </a>
          <span v-else class="no-data">—</span>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <!-- Dialog : création d'un nouveau produit -->
  <el-dialog v-model="createDialog" title="Nouveau produit" width="480px">
    <el-form label-position="top" @submit.prevent="submitCreate">
      <el-form-item label="Nom du produit">
        <el-input v-model="createForm.name" />
      </el-form-item>
      <el-form-item label="Description">
        <el-input v-model="createForm.description" type="textarea" :rows="2" />
      </el-form-item>
      <el-form-item label="Marque">
        <el-select
          v-model="createForm.brandId"
          filterable
          remote
          :remote-method="searchBrands"
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
      <el-form-item label="Site web (optionnel)">
        <el-input v-model="createForm.websiteUrl" placeholder="https://..." />
      </el-form-item>
      <el-form-item label="Photo (URL, optionnel)">
        <el-input v-model="createForm.picture" placeholder="https://..." />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createDialog = false">Annuler</el-button>
      <el-button
        type="primary"
        :loading="createLoading"
        :disabled="brandCreating"
        @click="submitCreate"
      >
        Créer
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 4px;
}
.page-header p {
  color: #6b7280;
  margin: 0;
  font-size: 14px;
}
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 22px 24px;
}
.product-cell {
  display: flex;
  flex-direction: column;
}
.product-cell .desc {
  font-size: 12px;
  color: #9ca3af;
}
.no-data {
  color: #9ca3af;
}
</style>