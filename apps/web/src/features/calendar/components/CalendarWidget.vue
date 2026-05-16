<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import { type UserId } from '@armali/schemas'
import DateDrawer from './DateDrawer.vue'
import NewEvent from './NewEventDrawer.vue'
import { useCalendar } from '../composables/useCalendar'
const { userId } = defineProps<{
  userId?: UserId
}>()
const { calendarOptions, dateSelect, openNewEvent } = useCalendar(userId)
</script>

<template>
  <div>
    <button @click="openNewEvent = true">Ajouter</button>
    <el-row i:gutter="20">
      <FullCalendar :options="calendarOptions" />
      <DateDrawer
        v-if="dateSelect !== null"
        :date="dateSelect"
        @close="dateSelect = null"
        :user-id="userId"
      />
      <el-drawer v-model="openNewEvent" direction="rtl" :with-header="false" size="420px">
        <NewEvent @close="openNewEvent = false" />
      </el-drawer>
    </el-row>
  </div>
</template>

<style scoped>
:deep(.event-animal) {
  background-color: var(--el-color-primary-light-3) !important;
  border-color: var(--el-color-primary-light-3) !important;
}
:deep(.event-internal) {
  background-color: var(--el-color-pink) !important;
  border-color: var(--el-color-pink) !important;
}
</style>
