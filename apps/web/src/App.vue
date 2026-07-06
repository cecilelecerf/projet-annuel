<script setup lang="ts">
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useMessagingStore } from '@/features/messaging/stores/messagingStore'
import { useNotify } from '@/composables/useNotify'
import type { UserRole } from '@armali/schemas'

const MESSAGING_ROLES: UserRole[] = ['VETERINARIAN', 'SECRETARY', 'DIRECTOR', 'REFERANT']

const authStore = useAuthStore()
const { user, isAuthenticated } = storeToRefs(authStore)
const messagingStore = useMessagingStore()
const notify = useNotify()

watch(
  () => [isAuthenticated.value, user.value?.role] as const,
  ([authed, role]) => {
    if (authed && role && MESSAGING_ROLES.includes(role)) {
      messagingStore.init()
    } else {
      messagingStore.teardown()
    }
  },
  { immediate: true },
)

watch(
  () => messagingStore.lastNotification,
  (notification) => {
    if (!notification) return
    notify.info(`${notification.senderName} : ${notification.preview}`)
  },
)
</script>

<template><RouterView /></template>
