<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { clientShopApi } from '@/features/shop/api/shop.api'
import type { ProductClinicWithClinic } from '@armali/schemas'

const router = useRouter()
const notify = useNotify()

const products = ref<ProductClinicWithClinic[]>([])
const loading = ref(false)
const searchQuery = ref('')

async function load() {
  loading.value = true
  try {
    products.value = await clientShopApi.getAll()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger la boutique')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return products.value
  return products.value.filter(
    (p) =>
      p.product.name.toLowerCase().includes(query) ||
      p.product.brand.name.toLowerCase().includes(query),
  )
})

function openDetail(product: ProductClinicWithClinic) {
  router.push({ name: 'CLIENT.Shop.Detail', params: { id: product.id } })
}
</script>

<template>
  <div class="page-header">
    <div>
      <h1>Boutique</h1>
      <p>Produits proposés par les cliniques de vos animaux</p>
    </div>
  </div>

  <el-input
    v-model="searchQuery"
    placeholder="Rechercher un produit ou une marque..."
    clearable
    style="margin-bottom: 20px; max-width: 360px"
  />

  <el-skeleton v-if="loading" :rows="6" animated />

  <template v-else>
    <div v-if="filteredProducts.length === 0" class="no-data">
      Aucun produit disponible pour le moment.
    </div>
    <div v-else class="products-grid">
      <div
        v-for="item in filteredProducts"
        :key="item.id"
        class="card product-card"
        @click="openDetail(item)"
      >
        <div class="product-card__image">
          <img v-if="item.product.picture" :src="item.product.picture" :alt="item.product.name" />
          <el-icon v-else><Goods /></el-icon>
        </div>
        <div class="product-card__body">
          <span class="product-card__brand">{{ item.product.brand.name }}</span>
          <strong class="product-card__name">{{ item.product.name }}</strong>
          <span class="product-card__clinic">{{ item.clinic.name }}</span>
          <span class="product-card__price">{{ item.price }} €</span>
        </div>
      </div>
    </div>
  </template>
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
.no-data {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: var(--spacing-2xl) 0;
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--spacing-md);
}
.product-card {
  cursor: pointer;
  transition: transform 0.15s ease;
  padding: 0;
  overflow: hidden;
}
.product-card:hover {
  transform: translateY(-2px);
}
.product-card__image {
  height: 140px;
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  font-size: 32px;
}
.product-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.product-card__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--spacing-md);
}
.product-card__brand {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
}
.product-card__name {
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.product-card__clinic {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.product-card__price {
  font-size: 16px;
  font-weight: var(--fw-bold);
  color: var(--el-color-primary);
  margin-top: var(--spacing-xs);
}
</style>