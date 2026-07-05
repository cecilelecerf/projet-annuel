import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { connectMessagingSocket, disconnectMessagingSocket, getMessagingSocket } from '@/lib/socket'
import { messagingApi } from '../api/messaging.api'
import type {
  Conversation,
  ConversationContactsResponse,
  ConversationId,
  ConversationMember,
  CreateConversation,
  Message,
  UserId,
} from '@armali/schemas'

export const useMessagingStore = defineStore('messaging', () => {
  const conversations = ref<Conversation[]>([])
  const contacts = ref<ConversationContactsResponse | null>(null)
  const activeConversationId = ref<ConversationId | null>(null)
  const messages = ref<Message[]>([])
  const hasMoreMessages = ref(false)
  const loadingMessages = ref(false)
  const typingUserIds = ref<Set<string>>(new Set())
  const onlineUserIds = ref<Set<string>>(new Set())
  const lastNotification = ref<{
    conversationId: string
    senderName: string
    preview: string
    at: string
  } | null>(null)
  let listenersBound = false
  let typingTimeout: ReturnType<typeof setTimeout> | null = null

  const sortedConversations = computed(() =>
    [...conversations.value].sort((a, b) => {
      const dateA = a.lastMessageAt ?? a.createdAt
      const dateB = b.lastMessageAt ?? b.createdAt
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    }),
  )

  const totalUnread = computed(() =>
    conversations.value.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),
  )

  const activeConversation = computed(() =>
    conversations.value.find((c) => c.id === activeConversationId.value) ?? null,
  )

  function upsertConversation(conversation: Conversation) {
    const idx = conversations.value.findIndex((c) => c.id === conversation.id)
    if (idx === -1) conversations.value.unshift(conversation)
    else conversations.value[idx] = { ...conversations.value[idx], ...conversation }
  }

  function updateMembers(conversationId: string, members: ConversationMember[]) {
    const conv = conversations.value.find((c) => c.id === conversationId)
    if (conv) conv.conversationMembers = members
  }

  function handleIncomingMessage(message: Message) {
    const authStore = useAuthStore()
    const isActive = activeConversationId.value === message.conversationId
    if (isActive && !messages.value.some((m) => m.id === message.id)) {
      messages.value.push(message)
    }

    const conv = conversations.value.find((c) => c.id === message.conversationId)
    const isOwn = message.senderId === authStore.user?.id
    if (conv) {
      conv.lastMessage = message
      conv.lastMessageAt = message.createdAt
      if (!isActive && !isOwn) conv.unreadCount = (conv.unreadCount ?? 0) + 1
    }

    if (!isActive && !isOwn) {
      lastNotification.value = {
        conversationId: message.conversationId,
        senderName: message.sender
          ? `${message.sender.firstname} ${message.sender.lastname}`
          : 'Nouveau message',
        preview: message.content,
        at: new Date().toISOString(),
      }
    }

    if (isActive && !isOwn) {
      void markRead(message.conversationId as ConversationId)
    }
  }

  function bindSocketListeners() {
    if (listenersBound) return
    const socket = connectMessagingSocket()

    socket.on('message:new', handleIncomingMessage)

    socket.on('conversation:new', (conversation: Conversation) => {
      upsertConversation(conversation)
    })

    socket.on('conversation:updated', (conversation: Conversation) => {
      upsertConversation(conversation)
    })

    socket.on(
      'conversation:member-removed',
      ({ conversationId, userId }: { conversationId: string; userId: string }) => {
        const authStore = useAuthStore()
        if (userId === authStore.user?.id) {
          conversations.value = conversations.value.filter((c) => c.id !== conversationId)
          if (activeConversationId.value === conversationId) activeConversationId.value = null
          return
        }
        const conv = conversations.value.find((c) => c.id === conversationId)
        if (conv?.conversationMembers) {
          conv.conversationMembers = conv.conversationMembers.filter((m) => m.userId !== userId)
        }
      },
    )

    socket.on('conversation:member-updated', (member: ConversationMember) => {
      const conv = conversations.value.find((c) => c.id === member.conversationId)
      if (!conv?.conversationMembers) return
      const idx = conv.conversationMembers.findIndex((m) => m.userId === member.userId)
      if (idx !== -1) conv.conversationMembers[idx] = member
    })

    socket.on(
      'conversation:read',
      ({
        conversationId,
        userId,
        readAt,
      }: {
        conversationId: string
        userId: string
        readAt: string
      }) => {
        const conv = conversations.value.find((c) => c.id === conversationId)
        const member = conv?.conversationMembers?.find((m) => m.userId === userId)
        if (member) member.lastReadAt = new Date(readAt)
      },
    )

    socket.on(
      'typing:update',
      ({
        conversationId,
        userId,
        isTyping,
      }: {
        conversationId: string
        userId: string
        isTyping: boolean
      }) => {
        if (conversationId !== activeConversationId.value) return
        const next = new Set(typingUserIds.value)
        if (isTyping) next.add(userId)
        else next.delete(userId)
        typingUserIds.value = next
      },
    )

    socket.on('presence:update', ({ userId, online }: { userId: string; online: boolean }) => {
      const next = new Set(onlineUserIds.value)
      if (online) next.add(userId)
      else next.delete(userId)
      onlineUserIds.value = next
    })

    listenersBound = true
  }

  async function init() {
    bindSocketListeners()
    await fetchConversations()
  }

  function teardown() {
    disconnectMessagingSocket()
    listenersBound = false
    conversations.value = []
    activeConversationId.value = null
    messages.value = []
  }

  async function fetchConversations() {
    conversations.value = await messagingApi.listConversations()
  }

  async function fetchContacts() {
    contacts.value = await messagingApi.getContacts()
    return contacts.value
  }

  async function createConversation(payload: CreateConversation) {
    const conversation = await messagingApi.createConversation(payload)
    upsertConversation(conversation)
    await openConversation(conversation.id as ConversationId)
    return conversation
  }

  async function openConversation(id: ConversationId) {
    activeConversationId.value = id
    messages.value = []
    hasMoreMessages.value = false
    loadingMessages.value = true
    try {
      const detail = await messagingApi.getConversation(id)
      messages.value = [...detail.messages].reverse()
      hasMoreMessages.value = detail.hasMore
      updateMembers(id, detail.conversation.conversationMembers ?? [])
      await markRead(id)
    } finally {
      loadingMessages.value = false
    }
  }

  async function loadOlderMessages() {
    const id = activeConversationId.value
    const oldest = messages.value[0]
    if (!id || !hasMoreMessages.value || !oldest) return
    const detail = await messagingApi.getConversation(id, { before: oldest.id })
    messages.value = [...[...detail.messages].reverse(), ...messages.value]
    hasMoreMessages.value = detail.hasMore
  }

  async function sendMessage(content: string) {
    const id = activeConversationId.value
    if (!id) return
    const socket = getMessagingSocket()
    if (socket?.connected) {
      socket.emit('message:send', { conversationId: id, content })
    } else {
      const message = await messagingApi.sendMessage(id, content)
      handleIncomingMessage(message)
    }
  }

  async function markRead(id: ConversationId) {
    const conv = conversations.value.find((c) => c.id === id)
    if (conv) conv.unreadCount = 0
    const socket = getMessagingSocket()
    if (socket?.connected) socket.emit('conversation:read', { conversationId: id })
    else await messagingApi.markRead(id)
  }

  function setTyping(isTyping: boolean) {
    const id = activeConversationId.value
    const socket = getMessagingSocket()
    if (!id || !socket?.connected) return
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId: id })

    if (typingTimeout) clearTimeout(typingTimeout)
    if (isTyping) {
      typingTimeout = setTimeout(() => setTyping(false), 4000)
    }
  }

  async function rename(id: ConversationId, name: string) {
    const conversation = await messagingApi.rename(id, name)
    upsertConversation(conversation)
  }

  async function addMembers(id: ConversationId, memberIds: UserId[]) {
    const conversation = await messagingApi.addMembers(id, memberIds)
    upsertConversation(conversation)
  }

  async function removeMember(id: ConversationId, userId: UserId) {
    await messagingApi.removeMember(id, userId)
    const authStore = useAuthStore()
    if (userId === authStore.user?.id) {
      conversations.value = conversations.value.filter((c) => c.id !== id)
      if (activeConversationId.value === id) activeConversationId.value = null
    } else {
      const conv = conversations.value.find((c) => c.id === id)
      if (conv?.conversationMembers) {
        conv.conversationMembers = conv.conversationMembers.filter((m) => m.userId !== userId)
      }
    }
  }

  async function updateMemberRole(
    id: ConversationId,
    userId: UserId,
    role: ConversationMember['role'],
  ) {
    const member = await messagingApi.updateMemberRole(id, userId, role)
    const conv = conversations.value.find((c) => c.id === id)
    if (conv?.conversationMembers) {
      const idx = conv.conversationMembers.findIndex((m) => m.userId === userId)
      if (idx !== -1) conv.conversationMembers[idx] = member
    }
  }

  return {
    conversations,
    contacts,
    activeConversationId,
    activeConversation,
    messages,
    hasMoreMessages,
    loadingMessages,
    typingUserIds,
    onlineUserIds,
    lastNotification,
    sortedConversations,
    totalUnread,
    init,
    teardown,
    fetchConversations,
    fetchContacts,
    createConversation,
    openConversation,
    loadOlderMessages,
    sendMessage,
    markRead,
    setTyping,
    rename,
    addMembers,
    removeMember,
    updateMemberRole,
  }
})
