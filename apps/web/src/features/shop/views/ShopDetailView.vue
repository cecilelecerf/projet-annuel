<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { clientShopApi } from '@/features/shop/api/shop.api'
import { useCartStore } from '@/features/shop/stores/cartStore'
import type { ProductClinicWithClinic, AnimalOption, ProductRecommendation } from '@armali/schemas'

const route = useRoute()
const router = useRouter()
const notify = useNotify()
const cart = useCartStore()

const product = ref<ProductClinicWithClinic | null>(null)
const loading = ref(false)
const quantity = ref(1)

async function load() {
  loading.value = true
  try {
    product.value = await clientShopApi.getById(route.params.id as string)
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger ce produit')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  loadRecommendationsForAllAnimals()
})

// Recharge les recommandations si on navigue d'une fiche produit à une autre
// (même composant réutilisé par Vue Router)
watch(() => route.params.id, load)

function addToCart() {
  if (!product.value) return
  cart.addItem(product.value, quantity.value)
  notify.success(`${quantity.value} × ${product.value.product.name} ajouté(s) au panier`)
}

// ── Recommandations automatiques pour tous les animaux du client ───────────

interface AnimalRecommendation {
  animalName: string
  recommendation: 'RECOMMENDED' | 'AVOID'
  matchedConditions: string[]
  dailyGrams: number | null
}

const animalRecommendations = ref<AnimalRecommendation[]>([])
const recommendationsLoading = ref(false)

async function loadRecommendationsForAllAnimals() {
  recommendationsLoading.value = true
  try {
    let animals: AnimalOption[] = []
    try {
      animals = await clientShopApi.getAnimals()
    } catch {
      return
    }
    if (animals.length === 0) return

    const results: AnimalRecommendation[] = []

    await Promise.all(
      animals.map(async (animal: AnimalOption) => {
        let list: ProductRecommendation[] = []
        try {
          list = await clientShopApi.getRecommendations(animal.id)
        } catch {
          return
        }
        const match = list.find((r: ProductRecommendation) => r.clinicProductId === route.params.id)
        if (match && match.recommendation) {
          results.push({
            animalName: animal.name,
            recommendation: match.recommendation,
            matchedConditions: match.matchedConditions,
            dailyGrams: match.dailyGrams,
          })
        }
      }),
    )

    animalRecommendations.value = results
  } finally {
    recommendationsLoading.value = false
  }
}
</script>

<template>
  <div class="page-header">
    <el-button text @click="router.push({ name: 'CLIENT.Shop' })">← Retour à la boutique</el-button>
  </div>

  <el-skeleton v-if="loading" :rows="8" animated />

  <div v-else-if="product" class="detail-layout">
    <div class="card image-card">
      <img v-if="product.product.picture" :src="product.product.picture" :alt="product.product.name" />
      <el-icon v-else class="placeholder-icon"><Goods /></el-icon>
    </div>

    <div class="card info-card">
      <span class="brand">{{ product.product.brand.name }}</span>
      <h1>{{ product.product.name }}</h1>
      <span class="clinic">Vendu par {{ product.clinic.name }}</span>
      <p v-if="product.product.description" class="description">
        {{ product.product.description }}
      </p>
      <div class="price-row">
        <span class="price">{{ product.price }} €</span>
        <el-tag v-if="product.stock <= 0" type="danger">Rupture de stock</el-tag>
        <el-tag v-else-if="product.stock <= product.minimumRequired" type="warning">
          Stock limité
        </el-tag>
      </div>

      <div class="add-to-cart">
        <el-input-number v-model="quantity" :min="1" :max="Math.max(product.stock, 1)" />
        <el-button type="primary" :disabled="product.stock <= 0" @click="addToCart">
          Ajouter au panier
        </el-button>
      </div>

      <!-- Recommandations automatiques, une par animal concerné -->
      <div v-if="!recommendationsLoading && animalRecommendations.length > 0" class="nutrition-panel">
        <div
          v-for="(rec, i) in animalRecommendations"
          :key="i"
          class="nutrition-alert"
          :class="rec.recommendation === 'AVOID' ? 'nutrition-alert--avoid' : 'nutrition-alert--recommended'"
        >
          <strong>
            {{ rec.recommendation === 'AVOID' ? 'À éviter' : 'Recommandé' }} pour {{ rec.animalName }}
          </strong>
          <p v-if="rec.matchedConditions.length > 0">
            En lien avec : {{ rec.matchedConditions.join(', ') }}
          </p>

          <div class="grammage-box">
            <h3>Ration journalière estimée</h3>
            <template v-if="rec.dailyGrams !== null">
              <span class="grammage-value">{{ rec.dailyGrams }} g / jour</span>
            </template>
            <template v-else>
              <span class="grammage-unavailable">
                Poids de {{ rec.animalName }} non renseigné — enregistrez-le lors d'une prochaine
                consultation pour obtenir une estimation.
              </span>
            </template>
          </div>
        </div>
        <p class="grammage-disclaimer">
          Estimation indicative basée sur une formule vétérinaire standard. Ne remplace pas l'avis
          de votre vétérinaire pour un besoin nutritionnel précis.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  margin-bottom: var(--spacing-md);
}
.detail-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: var(--spacing-lg);
}
.image-card {
  padding: 0;
  overflow: hidden;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
}
.image-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.placeholder-icon {
  font-size: 64px;
  color: var(--el-text-color-placeholder);
}
.info-card {
  display: flex;
  flex-direction: column;
}
.brand {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
}
.info-card h1 {
  font-size: 24px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: var(--spacing-xs) 0;
}
.clinic {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: var(--spacing-md);
}
.description {
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  margin-bottom: var(--spacing-md);
}
.price-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}
.price {
  font-size: 28px;
  font-weight: var(--fw-bold);
  color: var(--el-color-primary);
}
.add-to-cart {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.nutrition-panel {
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.nutrition-alert {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 13px;
}
.nutrition-alert p {
  margin: 4px 0 var(--spacing-sm);
  font-size: 12px;
}
.nutrition-alert--avoid {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}
.nutrition-alert--recommended {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.grammage-box {
  background: var(--el-bg-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  margin-top: var(--spacing-xs);
}
.grammage-box h3 {
  font-size: 11px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  margin: 0 0 4px;
}
.grammage-value {
  font-size: 18px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
}
.grammage-unavailable {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.grammage-disclaimer {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin: 0;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}
</style>