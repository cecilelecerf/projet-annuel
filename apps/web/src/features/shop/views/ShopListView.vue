<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { clientShopApi } from '@/features/shop/api/shop.api'
import type { ProductClinicWithClinic, AnimalOption, ProductRecommendation } from '@armali/schemas'

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

onMounted(() => {
  load()
  loadRecommendationsForAllAnimals()
})

// ── Cliniques distinctes + couleur d'accent par clinique ──────────────────
const CLINIC_COLORS = ['purple', 'teal', 'pink', 'yellow'] as const

const clinics = computed(() => {
  const map = new Map<string, string>()
  for (const p of products.value) {
    if (!map.has(p.clinic.id)) map.set(p.clinic.id, p.clinic.name)
  }
  return [...map.entries()].map(([id, name], index) => ({
    id,
    name,
    color: CLINIC_COLORS[index % CLINIC_COLORS.length],
  }))
})

function clinicColor(clinicId: string) {
  return clinics.value.find(
    (c: { id: string; name: string; color: (typeof CLINIC_COLORS)[number] | undefined }) =>
      c.id === clinicId,
  )?.color ?? 'purple'
}

const selectedClinicId = ref<string | 'all'>('all')

const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return products.value.filter((p: ProductClinicWithClinic) => {
    const matchesClinic =
      selectedClinicId.value === 'all' || p.clinic.id === selectedClinicId.value
    const matchesQuery =
      !query ||
      p.product.name.toLowerCase().includes(query) ||
      p.product.brand.name.toLowerCase().includes(query)
    return matchesClinic && matchesQuery
  })
})

const groupedByClinic = computed(() => {
  if (selectedClinicId.value !== 'all') {
    return [
      {
        clinic: clinics.value.find(
          (c: { id: string; name: string; color: (typeof CLINIC_COLORS)[number] | undefined }) =>
            c.id === filteredProducts.value[0]?.clinic.id,
        ),
        items: filteredProducts.value,
      },
    ]
  }
  const groups = new Map<string, ProductClinicWithClinic[]>()
  for (const item of filteredProducts.value) {
    if (!groups.has(item.clinic.id)) groups.set(item.clinic.id, [])
    groups.get(item.clinic.id)!.push(item)
  }
  return [...groups.entries()].map(([clinicId, items]) => ({
    clinic: clinics.value.find((c: { id: string; name: string; color: (typeof CLINIC_COLORS)[number] | undefined }) => c.id === clinicId),
    items,
  }))
})

function openDetail(product: ProductClinicWithClinic) {
  router.push({ name: 'CLIENT.Shop.Detail', params: { id: product.id } })
}

// ── Badges de recommandation, calculés automatiquement pour tous les animaux ─

interface RecommendationMatch {
  animalName: string
  recommendation: 'RECOMMENDED' | 'AVOID'
  matchedConditions: string[]
}

const recommendationsByProduct = ref<Map<string, RecommendationMatch[]>>(new Map())

async function loadRecommendationsForAllAnimals() {
  let animals: AnimalOption[] = []
  try {
    animals = await clientShopApi.getAnimals()
  } catch {
    return
  }
  if (animals.length === 0) return

  const map = new Map<string, RecommendationMatch[]>()

  await Promise.all(
    animals.map(async (animal: AnimalOption) => {
      let list: ProductRecommendation[] = []
      try {
        list = await clientShopApi.getRecommendations(animal.id)
      } catch {
        return
      }
      for (const rec of list) {
        if (!rec.recommendation) continue
        const existing = map.get(rec.clinicProductId) ?? []
        existing.push({
          animalName: animal.name,
          recommendation: rec.recommendation,
          matchedConditions: rec.matchedConditions,
        })
        map.set(rec.clinicProductId, existing)
      }
    }),
  )

  recommendationsByProduct.value = map
}

function badgeFor(productId: string) {
  const matches = recommendationsByProduct.value.get(productId) ?? []
  const recommended = matches.filter((m: RecommendationMatch) => m.recommendation === 'RECOMMENDED')
  const avoid = matches.filter((m: RecommendationMatch) => m.recommendation === 'AVOID')

  if (recommended.length > 0) {
    return {
      type: 'success' as const,
      text: `Recommandé pour ${recommended.map((m: RecommendationMatch) => m.animalName).join(', ')}`,
      tooltip: null,
    }
  }
  if (avoid.length > 0) {
    const conditions = [...new Set(avoid.flatMap((m: RecommendationMatch) => m.matchedConditions))]
    return {
      type: 'danger' as const,
      text: `À éviter pour ${avoid.map((m: RecommendationMatch) => m.animalName).join(', ')}`,
      tooltip: conditions.length > 0 ? conditions.join(', ') : null,
    }
  }
  return null
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
    style="margin-bottom: var(--spacing-sm); max-width: 360px"
  />

  <!-- Filtres par clinique -->
  <div v-if="clinics.length > 1" class="clinic-filters">
    <button
      class="clinic-pill"
      :class="{ 'clinic-pill--active': selectedClinicId === 'all' }"
      @click="selectedClinicId = 'all'"
    >
      Toutes les cliniques
    </button>
    <button
      v-for="clinic in clinics"
      :key="clinic.id"
      class="clinic-pill"
      :class="[`clinic-pill--${clinic.color}`, { 'clinic-pill--active': selectedClinicId === clinic.id }]"
      @click="selectedClinicId = clinic.id"
    >
      <span class="clinic-dot" :style="{ background: `var(--el-color-${clinic.color})` }" />
      {{ clinic.name }}
    </button>
  </div>

  <el-skeleton v-if="loading" :rows="6" animated />

  <template v-else>
    <div v-if="filteredProducts.length === 0" class="no-data">
      Aucun produit disponible pour le moment.
    </div>

    <div v-for="group in groupedByClinic" :key="group.clinic?.id ?? 'none'" class="clinic-section">
      <div v-if="selectedClinicId === 'all' && group.clinic" class="clinic-section__header">
        <span class="clinic-dot" :style="{ background: `var(--el-color-${group.clinic.color})` }" />
        <h2>{{ group.clinic.name }}</h2>
      </div>

      <div class="products-grid">
        <div
          v-for="item in group.items"
          :key="item.id"
          class="card product-card"
          :class="`product-card--${clinicColor(item.clinic.id)}`"
          @click="openDetail(item)"
        >
          <el-tooltip
            v-if="badgeFor(item.id)?.tooltip"
            :content="badgeFor(item.id)!.tooltip!"
            placement="top"
          >
            <el-tag :type="badgeFor(item.id)!.type" class="recommend-badge" size="small">
              {{ badgeFor(item.id)!.text }}
            </el-tag>
          </el-tooltip>
          <el-tag
            v-else-if="badgeFor(item.id)"
            :type="badgeFor(item.id)!.type"
            class="recommend-badge"
            size="small"
          >
            {{ badgeFor(item.id)!.text }}
          </el-tag>

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
    </div>
  </template>
</template>

<style scoped lang="scss">
.page-header {
  margin-bottom: var(--spacing-xs);
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

.clinic-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}
.clinic-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: var(--fw-medium);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--el-color-primary);
  }
}
.clinic-pill--active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: var(--fw-semibold);
}
.clinic-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.clinic-section {
  margin-bottom: var(--spacing-md);
}
.clinic-section__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}
.clinic-section__header h2 {
  font-size: 16px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  margin: 0;
}
.clinic-section__header .clinic-dot {
  width: 10px;
  height: 10px;
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
  border-top: 3px solid transparent;
  position: relative;
}
.product-card:hover {
  transform: translateY(-2px);
}

.product-card--purple { border-top-color: var(--el-color-purple); }
.product-card--teal { border-top-color: var(--el-color-teal); }
.product-card--pink { border-top-color: var(--el-color-pink); }
.product-card--yellow { border-top-color: var(--el-color-yellow); }

.recommend-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  max-width: calc(100% - 16px);
  white-space: normal;
  height: auto;
  line-height: 1.3;
  padding: 3px 8px;
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