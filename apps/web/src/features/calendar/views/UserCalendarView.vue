<script setup lang="ts">
import CalendarWidget from '../components/CalendarWidget.vue'
import type { UserId } from '@armali/schemas'
import { useRoute } from 'vue-router'

const route = useRoute()
const id = route.params.id as UserId
</script>

<template>
  <Suspense>
    <CalendarWidget :user-id="id" />
    <template #fallback>
      <div>Chargement...</div>
    </template>
  </Suspense>
</template>
