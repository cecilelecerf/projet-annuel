<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { useCartStore } from '@/features/shop/stores/cartStore'
import { ordersApi } from '@/features/shop/api/orders.api'
import type { Checkout, ClinicId, ProductClinicId, CheckoutResult } from '@armali/schemas'

const router = useRouter()
const notify = useNotify()
const cart = useCartStore()

const submitting = ref(false)

async function confirmOrder() {
  if (cart.items.length === 0) return
  submitting.value = true
  try {
    const payload: Checkout = {
      groups: cart.groupedByClinic.map((group) => ({
        clinicId: group.clinicId as ClinicId,
        items: group.items.map((item) => ({
          productClinicId: item.clinicProductId as ProductClinicId,
          quantity: item.quantity,
        })),
      })),
    }
    const result: CheckoutResult = await ordersApi.checkout(payload)
    window.location.href = result.checkoutUrl
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors de la validation de la commande')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page-header">
    <el-button text @click="router.push({ name: 'CLIENT.Cart' })">← Retour au panier</el-button>
    <h1>Récapitulatif de la commande</h1>
  </div>

  <div v-if="cart.items.length === 0" class="empty-cart">
    <p>Votre panier est vide.</p>
    <el-button type="primary" @click="router.push({ name: 'CLIENT.Shop' })">
      Aller à la boutique
    </el-button>
  </div>

  <template v-else>
    <p class="hint">
      Votre commande sera scindée en {{ cart.groupedByClinic.length }} commande(s), une par
      clinique, car chaque clinique gère son propre retrait.
    </p>

    <div v-for="group in cart.groupedByClinic" :key="group.clinicId" class="card clinic-group">
      <h2>{{ group.clinicName }}</h2>
      <div v-for="item in group.items" :key="item.clinicProductId" class="recap-item">
        <span>{{ item.quantity }} × {{ item.productName }}</span>
        <strong>{{ (item.price * item.quantity).toFixed(2) }} €</strong>
      </div>
      <div class="recap-subtotal">
        <span>Sous-total</span>
        <strong>
          {{ group.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2) }} €
        </strong>
      </div>
    </div>

    <div class="card total-card">
      <span>Total à payer</span>
      <strong>{{ cart.totalPrice.toFixed(2) }} €</strong>
    </div>

    <div class="actions">
      <el-button :loading="submitting" type="primary" size="large" @click="confirmOrder">
        Confirmer et payer
      </el-button>
    </div>
  </template>
</template>

<style scoped lang="scss">
.page-header {
  margin-bottom: var(--spacing-lg);
}
.page-header h1 {
  font-size: 22px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: var(--spacing-sm) 0 0;
}
.empty-cart {
  text-align: center;
  padding: var(--spacing-3xl) 0;
  color: var(--el-text-color-secondary);
}
.hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0 0 var(--spacing-md);
}
.clinic-group {
  margin-bottom: var(--spacing-md);
}
.clinic-group h2 {
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-md);
}
.recap-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  padding: 4px 0;
  color: var(--el-text-color-regular);
}
.recap-subtotal {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: var(--fw-semibold);
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--el-border-color-lighter);
}
.total-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
}
.actions {
  margin-top: var(--spacing-lg);
  display: flex;
  justify-content: flex-end;
}
.payment-note {
  text-align: right;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: var(--spacing-xs);
}
</style>