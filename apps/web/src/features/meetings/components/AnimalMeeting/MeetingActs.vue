<script setup lang="ts">
import type { AnimalMeetingAct } from '@armali/schemas'
import { ref } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { Plus } from '@element-plus/icons-vue'
import MeetingActCard from '@/features/acts/components/MeetingActCard.vue'

dayjs.locale('fr')

defineProps<{ acts: AnimalMeetingAct[] }>()

const isAddingAct = ref(false)
</script>

<template>
  <div class="section">
    <div class="section-label-row">
      <h3 class="section-label">
        <el-icon><List /></el-icon>
        Actes réalisés
        <span class="count-badge">{{ acts?.length ?? 0 }}</span>
      </h3>
      <el-button
        size="small"
        color="var(--el-color-teal)"
        plain
        @click="isAddingAct = true"
        :icon="Plus"
      >
        Ajouter
      </el-button>
    </div>

    <div v-if="acts?.length" class="acts-list">
      <MeetingActCard v-for="act in acts" :key="act.id" :act="act" />
    </div>

    <p v-else class="empty-text">Aucun acte réalisé</p>
  </div>
</template>

<style lang="scss" scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.section-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.count-badge {
  background: var(--el-fill-color);
  border-radius: var(--radius-full);
  padding: 1px 7px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}

// ── Bouton ────────────────────────────────────────────────────────────────────

.btn-label {
  display: none;

  @include above('md') {
    display: inline;
  }
}

// ── Liste ─────────────────────────────────────────────────────────────────────

.acts-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  position: relative;

  @include above('lg') {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}
// ── Empty ─────────────────────────────────────────────────────────────────────

.empty-text {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
}
</style>
