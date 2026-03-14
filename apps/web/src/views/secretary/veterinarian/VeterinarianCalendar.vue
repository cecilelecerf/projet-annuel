<script setup lang="ts">
import Calendar from '@/components/calendar/Calendar.vue'
import type { UserId } from '@schemas'
import { useRoute } from 'vue-router'

const route = useRoute()
const id = route.params.id as UserId
</script>

<template>
  <Suspense>
    <Calendar :user-id="id" />
    <template #fallback>
      <div>Chargement...</div>
    </template>
  </Suspense>
</template>
