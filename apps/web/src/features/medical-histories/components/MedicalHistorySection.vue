<script setup lang="ts">
import MeetingActForm from '@/features/medical-histories/components/MeetingActForm.vue'
import { MEETING_COLORS } from '@/utils/meetingColor'
import type { AnimalId, ClinicId, MedicalHistoryMeta, MeetingId } from '@armali/schemas'
import { Plus } from '@element-plus/icons-vue'
import { ref } from 'vue'
import MedicalHistoryCard from './MedicalHistoryCard.vue'
import FreeMedicalHistoryForm from './FreeMedicalHistoryForm.vue'
defineProps<{
  acts: MedicalHistoryMeta[]
  meetingId?: MeetingId
  animalId?: AnimalId
  clinicId?: ClinicId
  withAdd?: boolean
  disabeldTitle?: boolean
}>()
const showActForm = ref(false)
const editingAct = ref<MedicalHistoryMeta | null>(null)
const openAddAct = () => {
  editingAct.value = null
  showActForm.value = true
}

const openEditAct = (act: MedicalHistoryMeta) => {
  editingAct.value = act
  showActForm.value = true
}

const onSavedAct = () => {
  // emit('refresh')
}
</script>
<template>
  <div class="section">
    <div class="section-label-row" :class="`with-add-${withAdd} disabeld-title-${disabeldTitle}`">
      <h3 class="section-label" v-if="!disabeldTitle">
        <el-icon><List /></el-icon>

        Actes réalisés
        <span class="count-badge">{{ acts?.length ?? 0 }}</span>
      </h3>
      <el-button
        v-if="withAdd"
        size="small"
        :type="MEETING_COLORS.ANIMAL"
        plain
        @click="openAddAct"
        :icon="Plus"
      >
        Ajouter
      </el-button>
    </div>

    <div v-if="acts?.length" class="acts-list">
      <MedicalHistoryCard v-for="act in acts" :key="act.id" :act="act" @edit="openEditAct(act)" />
    </div>

    <p v-else class="empty-text">Aucun acte réalisé</p>
    <MeetingActForm
      v-if="!!meetingId || !!editingAct?.animalMeetingId"
      v-model="showActForm"
      :animalMeetingId="editingAct?.animalMeetingId ?? meetingId!"
      :clinic-id="clinicId"
      :act="editingAct"
      @saved="onSavedAct"
    />
    <FreeMedicalHistoryForm
      v-else-if="animalId || editingAct"
      :animal-id="editingAct?.animalId ?? animalId!"
      v-model="showActForm"
      :meeting-id="meetingId"
      :clinic-id="clinicId"
      :act="editingAct"
      @saved="onSavedAct"
    />
  </div>
</template>

<style lang="scss" scoped>
.section-label-row {
  display: flex;
  &.with-add-true.disabeld-title-true {
    justify-content: flex-end;
  }
}

.acts-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);

  @include above('md') {
    grid-template-columns: repeat(2, 1fr);
  }

  @include above('2xl') {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
