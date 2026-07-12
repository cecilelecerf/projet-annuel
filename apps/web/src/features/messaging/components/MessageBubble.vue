<script setup lang="ts">
import { computed } from 'vue'
import type { Message } from '@armali/schemas'

const props = defineProps<{
  message: Message
  isOwn: boolean
  showSender: boolean
  seenLabel?: string
}>()

const time = computed(() =>
  new Date(props.message.createdAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }),
)
</script>

<template>
  <div class="message-row" :class="{ 'message-row--own': isOwn }">
    <div class="message-bubble" :class="{ 'message-bubble--own': isOwn }">
      <span v-if="showSender && !isOwn" class="message-bubble__sender">
        {{ message.sender?.firstname }} {{ message.sender?.lastname }}
      </span>
      <p class="message-bubble__content">{{ message.content }}</p>
      <div class="message-bubble__meta">
        <span>{{ time }}</span>
        <span v-if="seenLabel" class="message-bubble__seen">· {{ seenLabel }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.message-row {
  display: flex;
  padding: var(--spacing-2xs) var(--spacing-md);
}
.message-row--own {
  justify-content: flex-end;
}
.message-bubble {
  max-width: 60%;
  background: var(--el-fill-color-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm) var(--spacing-md);
}
.message-bubble--own {
  background: var(--el-color-primary-light-8);
}
.message-bubble__sender {
  display: block;
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);
  color: var(--el-color-primary);
  margin-bottom: var(--spacing-2xs);
}
.message-bubble__content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
.message-bubble__meta {
  margin-top: var(--spacing-xs);
  font-size: var(--fs-xs);
  color: var(--el-text-color-placeholder);
  display: flex;
  gap: var(--spacing-xs);
  justify-content: flex-end;
}
</style>
