<script lang="ts" setup>
import ListUser from '@/components/users/ListUser.vue'
import { Suspense } from 'vue'
</script>

<template>
  <Suspense>
    <ListUser />
  </Suspense>
</template>
