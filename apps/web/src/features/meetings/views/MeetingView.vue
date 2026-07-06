<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { useRoute } from 'vue-router'
import { meetingApi } from '../api/meeting.api.ts'
import InternalMeetingDetail from '../components/internal-meeting/InternalMeetingDetail.vue'
import AnimalMeetingDetail from '../components/animal-meeting/AnimalMeetingDetail.vue'

dayjs.locale('fr')

const { params, query } = useRoute()

const meeting = await meetingApi.get(params.id as string, query.date as string | undefined)
</script>

<template>
  <InternalMeetingDetail v-if="meeting.kind === 'INTERNAL'" :meeting="meeting" />
  <AnimalMeetingDetail v-if="meeting.kind === 'ANIMAL'" :meeting="meeting" />
</template>
