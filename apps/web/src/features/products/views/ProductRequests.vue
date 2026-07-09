<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNotify } from '@/composables/useNotify'
import { productRequestsApi } from '@/features/products/api/product-requests.api'
import type { ProductRequestWithRelations, ProductRequestStatus } from '@armali/schemas'

const notify = useNotify()

const requests = ref<ProductRequestWithRelations[]>([])
const loading = ref(false)
const statusFilter = ref<ProductRequestStatus | ''>('PENDING')

const statusLabel: Record<ProductRequestStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Acceptée',
  REJECTED: 'Refusée',
}
const statusTag: Record<ProductRequestStatus, string> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
}

async function loadRequests() {
  loading.value = true
  try {
    requests.value = await productRequestsApi.getAll(statusFilter.value || undefined)
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger les demandes')
  } finally {
    loading.value = false
  }
}

onMounted(loadRequests)

const approvingId = ref<string | null>(null)

async function approve(request: ProductRequestWithRelations) {
  approvingId.value = request.id
  try {
    await productRequestsApi.approve(request.id)
    notify.success('Produit ajouté au catalogue')
    await loadRequests()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : "Erreur lors de l'approbation")
  } finally {
    approvingId.value = null
  }
}

// ── Rejet (avec motif optionnel) ──────────────────────────────────────────

const rejectDialog = ref(false)
const rejectTarget = ref<ProductRequestWithRelations | null>(null)
const rejectReason = ref('')
const rejectLoading = ref(false)

function openReject(request: ProductRequestWithRelations) {
  rejectTarget.value = request
  rejectReason.value = ''
  rejectDialog.value = true
}

async function submitReject() {
  if (!rejectTarget.value) return
  rejectLoading.value = true
  try {
    await productRequestsApi.reject(rejectTarget.value.id, {
      rejectionReason: rejectReason.value || undefined,
    })
    notify.success('Demande refusée')
    rejectDialog.value = false
    await loadRequests()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur lors du refus')
  } finally {
    rejectLoading.value = false
  }
}
</script>

<template>
  <div class="page-header">
    <div>
      <h1>Demandes de produits</h1>
      <p>Validez ou refusez les demandes d'ajout au catalogue faites par les cliniques</p>
    </div>
    <el-select
      v-model="statusFilter"
      placeholder="Filtrer par statut"
      style="width: 200px"
      @change="loadRequests"
    >
      <el-option label="En attente" value="PENDING" />
      <el-option label="Acceptées" value="APPROVED" />
      <el-option label="Refusées" value="REJECTED" />
      <el-option label="Toutes" value="" />
    </el-select>
  </div>

  <div class="card">
    <el-table v-loading="loading" :data="requests" style="width: 100%">
      <el-table-column label="Produit" min-width="220">
        <template #default="{ row }: { row: ProductRequestWithRelations }">
          <div class="product-cell">
            <strong>{{ row.name }}</strong>
            <span v-if="row.description" class="desc">{{ row.description }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Marque" width="180">
        <template #default="{ row }: { row: ProductRequestWithRelations }">
          <span v-if="row.brand">{{ row.brand.name }}</span>
          <span v-else class="new-brand">{{ row.newBrandName }} <em>(nouvelle)</em></span>
        </template>
      </el-table-column>
      <el-table-column label="Demandeur" min-width="200">
        <template #default="{ row }: { row: ProductRequestWithRelations }">
          <div class="product-cell">
            <span>{{ row.requestedBy.firstname }} {{ row.requestedBy.lastname }}</span>
            <span class="desc">{{ row.clinic.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Statut" width="120">
        <template #default="{ row }: { row: ProductRequestWithRelations }">
          <el-tag :type="statusTag[row.status] as any" size="small">
            {{ statusLabel[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="220">
        <template #default="{ row }: { row: ProductRequestWithRelations }">
          <template v-if="row.status === 'PENDING'">
            <el-button
              size="small"
              type="success"
              :loading="approvingId === row.id"
              @click="approve(row)"
            >
              Accepter
            </el-button>
            <el-button size="small" type="danger" plain @click="openReject(row)">
              Refuser
            </el-button>
          </template>
          <span v-else-if="row.status === 'REJECTED' && row.rejectionReason" class="reason">
            {{ row.rejectionReason }}
          </span>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="!loading && requests.length === 0" class="no-data">
      Aucune demande {{ statusFilter === 'PENDING' ? 'en attente' : '' }} pour le moment.
    </div>
  </div>

  <!-- Dialog : refus avec motif -->
  <el-dialog v-model="rejectDialog" title="Refuser la demande" width="420px">
    <p v-if="rejectTarget">{{ rejectTarget.name }}</p>
    <el-form label-position="top" @submit.prevent="submitReject">
      <el-form-item label="Motif (optionnel)">
        <el-input
          v-model="rejectReason"
          type="textarea"
          :rows="3"
          placeholder="Expliquez le refus..."
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="rejectDialog = false">Annuler</el-button>
      <el-button type="danger" :loading="rejectLoading" @click="submitReject">Refuser</el-button>
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
.new-brand em {
  font-size: 11px;
  color: #9ca3af;
  font-style: italic;
}
.reason {
  font-size: 12px;
  color: #9ca3af;
}
.no-data {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 20px 0;
}
</style>