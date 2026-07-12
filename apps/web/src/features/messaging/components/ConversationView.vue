<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useMessagingStore } from '../stores/messagingStore'
import { useNotify } from '@/composables/useNotify'
import MessageBubble from './MessageBubble.vue'
import GroupMembersDialog from './GroupMembersDialog.vue'
import { Setting, Promotion } from '@element-plus/icons-vue'
import type { ConversationMember, Message } from '@armali/schemas'

const authStore = useAuthStore()
const messagingStore = useMessagingStore()
const notify = useNotify()

const draft = ref('')
const scrollEl = ref<HTMLDivElement | null>(null)
const groupDialog = ref<InstanceType<typeof GroupMembersDialog> | null>(null)
const loadingOlder = ref(false)

const conversation = computed(() => messagingStore.activeConversation)

function otherMember() {
  return conversation.value?.conversationMembers?.find(
    (m: ConversationMember) => m.userId !== authStore.user?.id,
  )
}

const title = computed(() => {
  if (!conversation.value) return ''
  if (conversation.value.type === 'GROUP') return conversation.value.name ?? 'Groupe'
  const other = otherMember()
  return other?.user ? `${other.user.firstname} ${other.user.lastname}` : 'Conversation'
})

const statusLine = computed(() => {
  if (!conversation.value) return ''
  if (conversation.value.type === 'DIRECT') {
    const other = otherMember()
    if (other && messagingStore.onlineUserIds.has(other.userId)) return 'En ligne'
    return ''
  }
  return `${conversation.value.conversationMembers?.length ?? 0} membres`
})

const typingLabel = computed(() => {
  if (!conversation.value) return ''
  const ids = [...messagingStore.typingUserIds].filter((id) => id !== authStore.user?.id)
  if (ids.length === 0) return ''
  const names = ids.map((id) => {
    const member = conversation.value?.conversationMembers?.find(
      (m: ConversationMember) => m.userId === id,
    )
    return member?.user?.firstname ?? "Quelqu'un"
  })
  return names.length > 1 ? `${names.join(', ')} écrivent...` : `${names[0]} écrit...`
})

function seenLabel(message: Message, idx: number) {
  if (!conversation.value) return undefined
  const isOwn = message.senderId === authStore.user?.id
  if (!isOwn) return undefined
  const isLastOwn = !messagingStore.messages
    .slice(idx + 1)
    .some((m: Message) => m.senderId === authStore.user?.id)
  if (!isLastOwn) return undefined
 
  const others =
    conversation.value.conversationMembers?.filter(
      (m: ConversationMember) => m.userId !== authStore.user?.id,
    ) ?? []
  const seenBy = others.filter(
    (m: ConversationMember) =>
      m.lastReadAt && new Date(m.lastReadAt) >= new Date(message.createdAt),
  )
  if (seenBy.length === 0) return undefined
  return conversation.value.type === 'DIRECT' ? 'Vu' : `Vu par ${seenBy.length}`
}

async function scrollToBottom() {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}

watch(() => messagingStore.activeConversationId, scrollToBottom)
watch(() => messagingStore.messages.length, scrollToBottom)

async function onScroll() {
  if (!scrollEl.value || loadingOlder.value || !messagingStore.hasMoreMessages) return
  if (scrollEl.value.scrollTop > 40) return
  loadingOlder.value = true
  const prevHeight = scrollEl.value.scrollHeight
  try {
    await messagingStore.loadOlderMessages()
    await nextTick()
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight - prevHeight
  } finally {
    loadingOlder.value = false
  }
}

function onDraftInput() {
  messagingStore.setTyping(draft.value.trim().length > 0)
}

async function handleSend() {
  const content = draft.value.trim()
  if (!content) return
  draft.value = ''
  messagingStore.setTyping(false)
  try {
    await messagingStore.sendMessage(content)
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : "Impossible d'envoyer le message")
  }
}
</script>

<template>
  <div class="conversation-view">
    <template v-if="conversation">
      <header class="conversation-view__header">
        <div>
          <h3>{{ title }}</h3>
          <span class="conversation-view__status">{{ typingLabel || statusLine }}</span>
        </div>
        <el-button
          v-if="conversation.type === 'GROUP'"
          text
          :icon="Setting"
          @click="groupDialog?.open()"
        >
          Gérer le groupe
        </el-button>
      </header>

      <div ref="scrollEl" class="conversation-view__messages" @scroll="onScroll">
        <p v-if="loadingOlder" class="conversation-view__loading">Chargement…</p>
        <MessageBubble
          v-for="(message, idx) in messagingStore.messages"
          :key="message.id"
          :message="message"
          :is-own="message.senderId === authStore.user?.id"
          :show-sender="conversation.type === 'GROUP'"
          :seen-label="seenLabel(message, idx)"
        />
      </div>

      <form class="conversation-view__composer" @submit.prevent="handleSend">
        <el-input
          v-model="draft"
          placeholder="Écrire un message..."
          @input="onDraftInput"
          @keydown.enter.exact.prevent="handleSend"
        />
        <el-button
          type="primary"
          :icon="Promotion"
          native-type="submit"
          :disabled="!draft.trim()"
        />
      </form>

      <GroupMembersDialog ref="groupDialog" />
    </template>

    <div v-else class="conversation-view__empty">
      <el-empty description="Sélectionnez une discussion pour commencer" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.conversation-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.conversation-view__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px var(--spacing-lg);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.conversation-view__header h3 {
  margin: 0;
}
.conversation-view__status {
  font-size: var(--fs-sm);
  color: var(--el-text-color-secondary);
}
.conversation-view__messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md) 0;
}
.conversation-view__loading {
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--el-text-color-secondary);
  margin: 0 0 var(--spacing-sm);
}
.conversation-view__composer {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-md);
  border-top: 1px solid var(--el-border-color-lighter);
}
.conversation-view__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
