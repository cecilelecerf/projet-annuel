<script setup lang="ts">
import Calendar from '@/components/calendar/Calendar.vue'
</script>

<template>
  <Suspense>
    <Calendar />
    <template #fallback>
      <div>Chargement...</div>
    </template>
  </Suspense>
</template>
