<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import { type UserId } from '@armali/schemas'
import DateDrawer from './DateDrawer.vue'
import NewEvent from './NewEventDrawer.vue'
import { useCalendar } from '../composables/useCalendar'
import { computed } from 'vue'
const { userId } = defineProps<{
  userId?: UserId
}>()
const { calendarOptions, dateSelect, openNewEvent } = useCalendar(userId)

const isDateDrawerOpen = computed({
  get: () => dateSelect.value !== null,
  set: (val) => {
    if (!val) dateSelect.value = null
  },
})
</script>

<template>
  <div>
    <button @click="openNewEvent = true">Ajouter</button>
    <el-row i:gutter="20">
      <FullCalendar :options="calendarOptions" />
      <el-drawer v-model="isDateDrawerOpen" direction="rtl" :with-header="false" size="420px">
        <DateDrawer
          v-if="dateSelect !== null"
          :date="dateSelect"
          @close="dateSelect = null"
          :user-id="userId"
        />
      </el-drawer>

      <el-drawer v-model="openNewEvent" direction="rtl" :with-header="false" size="420px">
        <NewEvent @close="openNewEvent = false" />
      </el-drawer>
    </el-row>
  </div>
</template>

<style scoped>
:deep(.fc-event-main) {
  padding: unset;
}
:deep(.event-animal) {
  background-color: unset !important;
  border: unset !important;
  padding: 0;
}
:deep(.event-internal) {
  background-color: unset;
  border: unset !important;
  padding: 0;
}
</style>
