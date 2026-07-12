<script setup lang="ts">
import { onMounted } from 'vue'
import DrawerHeader from './DrawerHeader.vue'
import MeetingTypeSelector from './MeetingTypeSelector.vue'
import AnimalMeetingForm from './AnimalMeetingForm.vue'
import InternalMeetingForm from './InternalMeetingForm.vue'
import MeetingDateTimeFields from './fields/MeetingDateTimeFields.vue'
import { useMeetingDrawerForm } from '../../composables/useMeetingDrawerForm.ts'
import { useAuthStore } from '@/stores/authStore.ts'
import { useRouter } from 'vue-router'

const { initialDate } = defineProps<{
  initialDate: Date | null
}>()
const { user } = useAuthStore()
const router = useRouter()
const emit = defineEmits<{ close: [] }>()
if (user?.role === 'CLIENT' || user?.role === 'ADMIN') {
  router.push({ name: 'Forbidden' })
}
const {
  canCreateAnimal,
  date,
  start,
  end,
  type,
  title,
  location,
  clinicId,
  myClinics,
  showClinicSelect,
  participants,
  selectedClient,
  selectedVet,
  selectAnimal,
  clients,
  vets,
  staffs,
  animals,
  isVetLocked,
  isTimeValid,
  isFormValid,
  init,
  handleSubmit,
} = useMeetingDrawerForm(initialDate, emit)

onMounted(() => {
  init()
})
</script>

<template>
  <div class="drawer">
    <DrawerHeader :type="type" @close="$emit('close')" />

    <div v-if="showClinicSelect" class="field">
      <label class="field-label">Clinique</label>
      <el-select
        v-model="clinicId"
        placeholder="Choisir une clinique"
        size="large"
        style="width: 100%"
      >
        <el-option v-for="c in myClinics" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
    </div>

    <MeetingTypeSelector
      :type="type"
      :can-create-animal="canCreateAnimal"
      @update:type="(t) => (type = t)"
    />

    <div class="form">
      <AnimalMeetingForm
        v-if="type === 'ANIMAL'"
        v-model:selected-client="selectedClient"
        v-model:select-animal="selectAnimal"
        v-model:selected-vet="selectedVet"
        v-model:clinic-id="clinicId"
        v-model:date="date"
        v-model:start="start"
        v-model:end="end"
        v-model:is-time-valid="isTimeValid"
        :clients="clients"
        :animals="animals"
        :vets="vets"
        :is-vet-locked="isVetLocked"
      />

      <template v-if="type === 'INTERNAL'">
        <InternalMeetingForm
          v-model:title="title"
          v-model:participants="participants"
          v-model:location="location"
          :staffs="staffs"
        />
        <MeetingDateTimeFields v-model:date="date" v-model:start="start" v-model:end="end" />
      </template>
    </div>

    <div class="drawer-footer">
      <el-button size="large" @click="$emit('close')">Annuler</el-button>
      <el-button type="primary" size="large" :disabled="!isFormValid" @click="handleSubmit">
        Créer l'événement
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: 0 var(--spacing-lg);
  margin-top: var(--spacing-md);
}

.field-label {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.drawer-footer {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--el-border-color-lighter);

  .el-button {
    flex: 1;
  }
}
</style>
