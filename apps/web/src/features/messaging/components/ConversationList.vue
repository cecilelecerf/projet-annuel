<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useMessagingStore } from '../stores/messagingStore'
import type { Conversation } from '@armali/schemas'
import { Plus } from '@element-plus/icons-vue'

const emit = defineEmits<{ new: [] }>()

const authStore = useAuthStore()
const messagingStore = useMessagingStore()

function otherMember(conversation: Conversation) {
  return conversation.conversationMembers?.find((m) => m.userId !== authStore.user?.id)
}

function title(conversation: Conversation) {
  if (conversation.type === 'GROUP') return conversation.name ?? 'Groupe'
  const other = otherMember(conversation)
  return other?.user ? `${other.user.firstname} ${other.user.lastname}` : 'Conversation'
}

function subtitle(conversation: Conversation) {
  if (conversation.type === 'GROUP') {
    return conversation.scope === 'DIRECTOR_NETWORK'
      ? 'Réseau des directeurs'
      : `${conversation.conversationMembers?.length ?? 0} membres`
  }
  return conversation.scope === 'DIRECTOR_NETWORK' ? 'Directeur' : ''
}

function initials(conversation: Conversation) {
  if (conversation.type === 'GROUP') return (conversation.name ?? 'G').slice(0, 2).toUpperCase()
  const other = otherMember(conversation)
  if (!other?.user) return '?'
  return `${other.user.firstname[0]}${other.user.lastname[0]}`.toUpperCase()
}

function isOnline(conversation: Conversation) {
  if (conversation.type !== 'DIRECT') return false
  const other = otherMember(conversation)
  return other ? messagingStore.onlineUserIds.has(other.userId) : false
}

function lastMessagePreview(conversation: Conversation) {
  if (!conversation.lastMessage) return 'Aucun message'
  return conversation.lastMessage.content
}

const conversations = computed(() => messagingStore.sortedConversations)
</script>

<template>
  <div class="conversation-list">
    <div class="conversation-list__header">
      <h2>Messagerie</h2>
      <el-button type="primary" :icon="Plus" circle @click="emit('new')" />
    </div>

    <el-scrollbar class="conversation-list__scroll">
      <p v-if="conversations.length === 0" class="conversation-list__empty">
        Aucune discussion pour l'instant.
      </p>
      <button
        v-for="conversation in conversations"
        :key="conversation.id"
        class="conversation-item"
        :class="{
          'conversation-item--active': conversation.id === messagingStore.activeConversationId,
        }"
        @click="messagingStore.openConversation(conversation.id)"
      >
        <div class="conversation-item__avatar-wrap">
          <el-avatar :size="42">{{ initials(conversation) }}</el-avatar>
          <span v-if="isOnline(conversation)" class="conversation-item__online" />
        </div>
        <div class="conversation-item__body">
          <div class="conversation-item__top">
            <span class="conversation-item__title">{{ title(conversation) }}</span>
          </div>
          <div class="conversation-item__bottom">
            <span class="conversation-item__preview">{{ lastMessagePreview(conversation) }}</span>
            <el-badge
              v-if="conversation.unreadCount"
              :value="conversation.unreadCount"
              class="conversation-item__badge"
            />
          </div>
          <span v-if="subtitle(conversation)" class="conversation-item__subtitle">
            {{ subtitle(conversation) }}
          </span>
        </div>
      </button>
    </el-scrollbar>
  </div>
</template>

<style scoped lang="scss">
.conversation-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid var(--el-border-color-lighter);
}
.conversation-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
}
.conversation-list__header h2 {
  margin: 0;
  font-size: var(--fs-2xl);
}
.conversation-list__scroll {
  flex: 1;
}
.conversation-list__empty {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--el-text-color-secondary);
}
.conversation-item {
  display: flex;
  gap: var(--spacing-md);
  width: 100%;
  padding: 10px var(--spacing-md);
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  align-items: center;
}
.conversation-item:hover {
  background: var(--el-fill-color-light);
}
.conversation-item--active {
  background: var(--el-fill-color);
}
.conversation-item__avatar-wrap {
  position: relative;
  flex-shrink: 0;
}
.conversation-item__online {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  background: var(--el-color-success);
  border: 2px solid var(--el-bg-color);
}
.conversation-item__body {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.conversation-item__top {
  display: flex;
  justify-content: space-between;
}
.conversation-item__title {
  font-weight: var(--fw-semibold);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conversation-item__bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
}
.conversation-item__preview {
  font-size: var(--fs-base);
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conversation-item__subtitle {
  font-size: var(--fs-sm);
  color: var(--el-text-color-placeholder);
}
</style>
