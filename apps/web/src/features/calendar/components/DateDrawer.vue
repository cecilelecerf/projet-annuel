<script setup lang="ts">
import { api } from '@/lib/api'
import { meetingSchema, type Meeting, type UserId } from '@armali/schemas'
import dayjs from 'dayjs'
import { ref } from 'vue'
import EventContainer from './EventCard.vue'

const { date, userId } = defineProps<{
  date: Date
  userId?: UserId
}>()
defineEmits<{ close: [] }>()
async function fetchMeetings() {
  const start = dayjs(date).format('YYYY-MM-DD')
  return api(
    `/calendar${userId ? '/' + userId : ''}/mettings?startDate=${start}&endDate=${start}`,
  ).then((data) => meetingSchema.array().parse(data))
}
const mettings = ref<Meeting[] | null>(null)
fetchMeetings().then((data) => (mettings.value = data))
</script>
<template>
  <div class="root">
    <el:row :gap="7" class="header">
      <p>Jour {{ date }}</p>
      <el-icon @click="$emit('close')"><CloseBold /></el-icon>
    </el:row>
    <el-col v-for="value in mettings">
      <EventContainer :metting="value" />
    </el-col>
  </div>
</template>

<style lang="scss" scoped>
.root {
  padding: var(--spacing-md);
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
