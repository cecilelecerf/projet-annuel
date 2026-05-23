<script setup lang="ts">
import MeetingActCard from '@/features/acts/components/MeetingActCard.vue'
import type { AnimalMeetingAct, MeetingId } from '@armali/schemas'
import { Plus } from '@element-plus/icons-vue'
import { ref } from 'vue'
defineProps<{ acts: AnimalMeetingAct[]; meetingId: MeetingId }>()
const showActForm = ref(false)
const editingAct = ref<AnimalMeetingAct | null>(null)

const openAddAct = () => {
  editingAct.value = null
  showActForm.value = true
}

const openEditAct = (act: AnimalMeetingAct) => {
  editingAct.value = act
  showActForm.value = true
}

const onSavedAct = () => {
  // emit('refresh')
}
</script>
<template>
  <div class="section">
    <div class="section-label-row">
      <h3 class="section-label">
        <el-icon><List /></el-icon>

        Actes réalisés
        <span class="count-badge">{{ acts?.length ?? 0 }}</span>
      </h3>
      <el-button size="small" color="var(--el-color-teal)" plain @click="openAddAct" :icon="Plus">
        Ajouter
      </el-button>
    </div>

    <div v-if="acts?.length" class="acts-list">
      <MeetingActCard v-for="act in acts" :key="act.id" :act="act" @edit="openEditAct(act)" />
    </div>

    <p v-else class="empty-text">Aucun acte réalisé</p>
    <MeetingActForm
      v-model="showActForm"
      :meeting-id="meetingId"
      :act="editingAct"
      @saved="onSavedAct"
    />
  </div>
</template>

<style lang="scss" scoped>
.acts-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);

  @include above('md') {
    grid-template-columns: repeat(2, 1fr);
  }

  @include above('xl') {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
