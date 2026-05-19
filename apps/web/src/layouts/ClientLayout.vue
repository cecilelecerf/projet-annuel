<script setup lang="ts">
import FormError from '@/components/ui/FormError.vue'
</script>

<template>
  <FormError />
  <div>
    <nav>
      <router-link to="/client/rdv">Mes rendez-vous</router-link>
      <router-link to="/client/animaux">Mes animaux</router-link>
      <router-link to="/client/messages">Messages</router-link>
    </nav>

    <main>
      <router-view />
    </main>
  </div>
</template>
