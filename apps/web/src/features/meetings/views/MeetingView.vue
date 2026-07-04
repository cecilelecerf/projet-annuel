<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { useRoute } from 'vue-router'
import { meetingApi } from '../api/meeting.api.ts'
import AnimalMeeting from '../components/animal-meeting/AnimalMeetingComponent.vue'
import InternalMeeting from '../components/internal-meeting/InternalMeeting.vue'

dayjs.locale('fr')

const { params, query } = useRoute()

const meeting = await meetingApi.get(params.id as string, query.date as string | undefined)
</script>

<template>
  <InternalMeeting v-if="meeting.kind === 'INTERNAL'" :meeting="meeting" />
  <AnimalMeeting v-if="meeting.kind === 'ANIMAL'" :meeting="meeting" />
</template>
