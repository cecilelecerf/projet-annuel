<script setup lang="ts">
import CalendarWidget from '../components/calendar/CalendarWidget.vue'
</script>

<template>
  <Suspense>
    <CalendarWidget />
    <template #fallback>
      <div>Chargement...</div>
    </template>
  </Suspense>
</template>
