<script setup lang="ts">
import { Plus, Refresh } from '@element-plus/icons-vue'
import { useAvailabilities } from '../composables/useAvailabilities.ts'
import AvailabilityRecurringList from '../components/RecurringList.vue'
import AvailabilityPunctualList from '../components/PunctualList.vue'
import AvailabilityCalendar from '../components/Calendar.vue'
import AvailabilityDialog from '../components/Dialog.vue'
import type { AvailabilityResponse } from '@armali/schemas'

const {
  availabilities,
  loading,
  showDialog,
  editingId,
  saving,
  deleting,
  form,
  recurring,
  punctual,
  fetchAvailabilities,
  openCreate,
  openEdit,
  save,
  remove,
} = useAvailabilities()

await fetchAvailabilities()
</script>

<template>
  <div class="availabilities">
    <div class="section-header">
      <div>
        <h2 class="section-title">Disponibilités</h2>
        <p class="section-desc">
          Définissez vos créneaux pour que les clients puissent prendre rendez-vous.
        </p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" plain @click="openCreate('RECURRING')">Récurrence</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate('PUNCTUAL')">
          Date ponctuelle
        </el-button>
      </div>
    </div>

    <template v-if="loading">
      <el-skeleton :rows="3" animated />
    </template>

    <template v-else>
      <AvailabilityRecurringList
        :recurring="recurring"
        :deleting="deleting"
        @edit="openEdit"
        @remove="remove"
        @create="openCreate('RECURRING')"
      />

      <AvailabilityPunctualList
        :punctual="punctual"
        :deleting="deleting"
        @edit="openEdit($event as AvailabilityResponse)"
        @remove="remove"
        @create="openCreate('PUNCTUAL')"
      />

      <AvailabilityCalendar :availabilities="availabilities" />
    </template>

    <AvailabilityDialog
      v-model:form="form"
      v-model:show="showDialog"
      :saving="saving"
      :is-editing="!!editingId"
      @save="save"
    />
  </div>
</template>

<style scoped lang="scss">
.availabilities {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.section-title {
  font-family: 'Nunito', sans-serif;
  font-size: 20px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 4px;
}

.section-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}
</style>
