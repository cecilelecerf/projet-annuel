<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useNotify } from '@/composables/useNotify'
import { useAuthStore } from '@/stores/authStore'
import { budgetApi } from '../api/budget.api'
import type { BudgetSummary } from '@armali/schemas'

const notify = useNotify()
const authStore = useAuthStore()

// Seul le directeur peut créditer le budget — le référent ne fait que le dépenser
const canCredit = computed(() => authStore.user?.role === 'DIRECTOR')

const summary = ref<BudgetSummary | null>(null)
const loading = ref(false)
const creditDialogOpen = ref(false)
const submitting = ref(false)

const form = ref({ amount: 0, reason: '' })

async function load() {
  loading.value = true
  try {
    summary.value = await budgetApi.get()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger le budget')
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openCreditDialog() {
  form.value = { amount: 0, reason: '' }
  creditDialogOpen.value = true
}

async function submitCredit() {
  if (form.value.amount <= 0) {
    notify.error('Le montant doit être positif')
    return
  }
  submitting.value = true
  try {
    await budgetApi.credit({
      amount: form.value.amount,
      reason: form.value.reason || undefined,
    })
    notify.success('Budget crédité')
    creditDialogOpen.value = false
    await load()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : "Impossible de créditer le budget")
  } finally {
    submitting.value = false
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const typeConfig = {
  CREDIT: { label: 'Crédit', tag: 'success' as const, sign: '+' },
  DEBIT: { label: 'Commande fournisseur', tag: 'warning' as const, sign: '-' },
  REFUND: { label: 'Remboursement', tag: 'info' as const, sign: '+' },
}
</script>

<template>
  <div class="page-header">
    <div>
      <h1>Budget clinique</h1>
      <p>Suivi des fonds disponibles pour vos commandes fournisseurs</p>
    </div>
    <el-button v-if="canCredit" type="primary" @click="openCreditDialog">Créditer le budget</el-button>
  </div>

  <el-skeleton v-if="loading" :rows="4" animated />

  <template v-else-if="summary">
    <div class="card balance-card">
      <span class="balance-label">Solde disponible</span>
      <span class="balance-value">{{ formatCurrency(summary.balance) }}</span>
    </div>

    <div class="card">
      <h2>Historique</h2>
      <div v-if="summary.transactions.length === 0" class="no-data">
        Aucune transaction pour le moment.
      </div>
      <div v-else class="transaction-list">
        <div v-for="tx in summary.transactions" :key="tx.id" class="transaction-item">
          <div class="tx-main">
            <el-tag :type="typeConfig[tx.type].tag" size="small">
              {{ typeConfig[tx.type].label }}
            </el-tag>
            <span class="tx-reason">{{ tx.reason || '—' }}</span>
          </div>
          <div class="tx-meta">
            <span class="tx-author">
              {{ tx.createdBy.firstname }} {{ tx.createdBy.lastname }}
            </span>
            <span class="tx-date">{{ formatDate(tx.createdAt) }}</span>
          </div>
          <span class="tx-amount" :class="`tx-amount--${tx.type.toLowerCase()}`">
            {{ typeConfig[tx.type].sign }}{{ formatCurrency(tx.amount) }}
          </span>
        </div>
      </div>
    </div>
  </template>

  <el-dialog v-if="canCredit" v-model="creditDialogOpen" title="Créditer le budget" width="420px">
    <el-form label-position="top">
      <el-form-item label="Montant (€)">
        <el-input-number v-model="form.amount" :min="0.01" :step="10" :precision="2" style="width: 100%" />
      </el-form-item>
      <el-form-item label="Motif (optionnel)">
        <el-input v-model="form.reason" placeholder="Ex : Approvisionnement trimestriel" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="creditDialogOpen = false">Annuler</el-button>
      <el-button type="primary" :loading="submitting" @click="submitCredit">Créditer</el-button>
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

.balance-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}
.balance-label {
  font-size: 12px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.balance-value {
  font-size: 36px;
  font-weight: var(--fw-bold);
  color: var(--el-color-primary);
}

.card h2 {
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-md);
}
.no-data {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.transaction-item {
  display: grid;
  grid-template-columns: 2fr 1.5fr auto;
  align-items: center;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.transaction-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.tx-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.tx-reason {
  font-size: 13px;
  color: var(--el-text-color-primary);
}
.tx-meta {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.tx-amount {
  font-weight: var(--fw-bold);
  font-size: 15px;
  text-align: right;
}
.tx-amount--credit,
.tx-amount--refund {
  color: var(--el-color-success);
}
.tx-amount--debit {
  color: var(--el-color-danger);
}

@media (max-width: 640px) {
  .transaction-item {
    grid-template-columns: 1fr;
    gap: var(--spacing-xs);
  }
  .tx-amount {
    text-align: left;
  }
}
</style>