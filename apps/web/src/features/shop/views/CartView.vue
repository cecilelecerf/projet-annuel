<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCartStore } from '@/features/shop/stores/cartStore'

const router = useRouter()
const cart = useCartStore()
</script>

<template>
  <div class="page-header">
    <h1>Mon panier</h1>
    <p>{{ cart.totalItems }} article(s)</p>
  </div>

  <div v-if="cart.items.length === 0" class="empty-cart">
    <p>Votre panier est vide.</p>
    <el-button type="primary" @click="router.push({ name: 'CLIENT.Shop' })">
      Aller à la boutique
    </el-button>
  </div>

  <template v-else>
    <div v-for="group in cart.groupedByClinic" :key="group.clinicId" class="card clinic-group">
      <h2>{{ group.clinicName }}</h2>
      <div v-for="item in group.items" :key="item.clinicProductId" class="cart-item">
        <div class="cart-item__image">
          <img v-if="item.picture" :src="item.picture" :alt="item.productName" />
          <el-icon v-else><Goods /></el-icon>
        </div>
        <div class="cart-item__info">
          <span class="cart-item__brand">{{ item.brandName }}</span>
          <strong>{{ item.productName }}</strong>
          <span class="cart-item__price">{{ item.price }} € / unité</span>
        </div>
        <el-input-number
          :model-value="item.quantity"
          :min="1"
          :max="item.maxStock"
          @update:model-value="(val: number | undefined) => cart.updateQuantity(item.clinicProductId, val ?? 1)"
        />
        <span class="cart-item__subtotal">{{ (item.price * item.quantity).toFixed(2) }} €</span>
        <el-button text type="danger" @click="cart.removeItem(item.clinicProductId)">
          Retirer
        </el-button>
      </div>
    </div>

    <div class="card total-card">
      <span>Total</span>
      <strong>{{ cart.totalPrice.toFixed(2) }} €</strong>
    </div>

    <div class="actions">
      <el-button text @click="router.push({ name: 'CLIENT.Shop' })">Continuer mes achats</el-button>
      <el-button type="primary" @click="router.push({ name: 'CLIENT.Checkout' })">
        Passer commande
      </el-button>
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
.empty-cart {
  text-align: center;
  padding: var(--spacing-3xl) 0;
  color: var(--el-text-color-secondary);
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
.cart-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.cart-item:last-child {
  border-bottom: none;
}
.cart-item__image {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
  overflow: hidden;
}
.cart-item__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cart-item__info {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 2px;
}
.cart-item__brand {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
}
.cart-item__price {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.cart-item__subtotal {
  font-weight: var(--fw-semibold);
  min-width: 70px;
  text-align: right;
}
.total-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
}
.actions {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-md);
}
</style>