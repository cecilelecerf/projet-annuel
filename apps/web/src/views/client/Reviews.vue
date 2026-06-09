<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()

interface Vet {
  id: string
  firstname: string
  lastname: string
  bio: string | null
  clinics: string[]
  averageRating: number | null
  reviewCount: number
}

interface MyReview {
  veterinarianId: string
  rating: number
  comment: string | null
}

const vets = ref<Vet[]>([])
const myReviews = ref<MyReview[]>([])
const loading = ref(true)

const selectedVet = ref<Vet | null>(null)
const dialogVisible = ref(false)
const formRating = ref(0)
const formComment = ref('')
const submitting = ref(false)

onMounted(async () => {
  try {
    const [vetsData, reviewsData] = await Promise.all([
      api('/reviews/vets'),
      api('/reviews/mine'),
    ])
    vets.value = vetsData
    myReviews.value = reviewsData
  } catch {
    notify.error('Erreur lors du chargement')
  } finally {
    loading.value = false
  }
})

function getMyReview(vetId: string): MyReview | undefined {
  return myReviews.value.find((r) => r.veterinarianId === vetId)
}

function openReviewDialog(vet: Vet) {
  selectedVet.value = vet
  const existing = getMyReview(vet.id)
  formRating.value = existing?.rating ?? 0
  formComment.value = existing?.comment ?? ''
  dialogVisible.value = true
}

async function submitReview() {
  if (!selectedVet.value || formRating.value === 0) {
    notify.error('Veuillez attribuer une note')
    return
  }
  submitting.value = true
  try {
    const review = await api('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        veterinarianId: selectedVet.value.id,
        rating: formRating.value,
        comment: formComment.value || undefined,
      }),
    })
    const idx = myReviews.value.findIndex((r) => r.veterinarianId === selectedVet.value!.id)
    if (idx >= 0) {
      myReviews.value[idx] = review
    } else {
      myReviews.value.push(review)
    }
    const freshVets: Vet[] = await api('/reviews/vets')
    vets.value = freshVets
    notify.success('Avis enregistré !')
    dialogVisible.value = false
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur')
  } finally {
    submitting.value = false
  }
}


</script>

<template>
  <div class="reviews-page">
    <h1 class="page-title">Évaluer un vétérinaire</h1>
    <p class="page-subtitle">Partagez votre expérience pour aider la communauté</p>

    <div v-if="loading" class="loading">
      <el-skeleton :rows="4" animated />
    </div>

    <div v-else class="vets-grid">
      <div
        v-for="vet in vets"
        :key="vet.id"
        class="vet-card"
      >
        <div class="vet-avatar">{{ vet.firstname[0] }}{{ vet.lastname[0] }}</div>
        <div class="vet-info">
          <div class="vet-name">Dr {{ vet.firstname }} {{ vet.lastname }}</div>
          <div v-if="vet.clinics.length" class="vet-clinics">{{ vet.clinics.join(', ') }}</div>
          <div class="vet-rating">
            <el-rate
              :model-value="vet.averageRating ?? 0"
              disabled
              show-score
              :score-template="vet.averageRating ? `${vet.averageRating}/5 (${vet.reviewCount} avis)` : 'Aucun avis'"
            />
          </div>
        </div>
        <div class="vet-actions">
          <el-button
            :type="getMyReview(vet.id) ? 'warning' : 'success'"
            plain
            size="small"
            @click="openReviewDialog(vet)"
          >
            {{ getMyReview(vet.id) ? 'Modifier mon avis' : 'Laisser un avis' }}
          </el-button>
          <div v-if="getMyReview(vet.id)" class="my-rating">
            <el-rate :model-value="getMyReview(vet.id)!.rating" disabled size="small" />
          </div>
        </div>
      </div>

      <div v-if="vets.length === 0" class="empty">
        <p>Aucun vétérinaire disponible pour le moment.</p>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="`Évaluer Dr ${selectedVet?.firstname} ${selectedVet?.lastname}`"
      width="480px"
      align-center
    >
      <div class="review-form">
        <div class="rating-label">Votre note</div>
        <el-rate
          v-model="formRating"
          :texts="['Très insatisfait', 'Insatisfait', 'Correct', 'Bien', 'Excellent']"
          show-text
          size="large"
        />
        <div class="comment-label">Commentaire (optionnel)</div>
        <el-input
          v-model="formComment"
          type="textarea"
          :rows="4"
          placeholder="Décrivez votre expérience..."
          maxlength="500"
          show-word-limit
        />
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">Annuler</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="formRating === 0"
          @click="submitReview"
        >
          Enregistrer
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.reviews-page { padding: 32px; max-width: 900px; margin: auto; }
.page-title { font-size: 26px; font-weight: 700; margin: 0 0 4px; }
.page-subtitle { color: #888; margin: 0 0 28px; }
.loading { padding: 20px; }
.vets-grid { display: flex; flex-direction: column; gap: 16px; }
.vet-card {
  background: white;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
  display: flex;
  align-items: center;
  gap: 20px;
}
.vet-avatar {
  width: 52px; height: 52px; border-radius: 50%;
  background: #409eff; color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700; flex-shrink: 0;
}
.vet-info { flex: 1; }
.vet-name { font-size: 16px; font-weight: 600; margin-bottom: 2px; }
.vet-clinics { font-size: 13px; color: #888; margin-bottom: 6px; }
.vet-rating { margin-top: 4px; }
.vet-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.my-rating { display: flex; align-items: center; }
.empty { text-align: center; color: #888; padding: 40px; }
.review-form { display: flex; flex-direction: column; gap: 16px; }
.rating-label, .comment-label { font-weight: 600; font-size: 14px; }
</style>
