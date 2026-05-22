<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { useRoute } from 'vue-router'
import { calendarApi } from '../api/calendar.api'
import InternalMeeting from '../components/InternalMeeting.vue'
import AnimalMeeting from '../components/AnimalMeeting.vue'

dayjs.locale('fr')

const { params, query } = useRoute()

const meeting = await calendarApi.getMeeting(params.id as string, query.date as string | undefined)
</script>

<template>
  <InternalMeeting v-if="meeting.kind === 'INTERNAL'" :meeting="meeting" />
  <AnimalMeeting v-if="meeting.kind === 'ANIMAL'" :meeting="meeting" />
</template>
