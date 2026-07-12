import { http } from '@/lib/api'
import {
  conversationSchema,
  conversationDetailSchema,
  conversationContactsResponseSchema,
  conversationMemberSchema,
  messageSchema,
  type Conversation,
  type ConversationDetail,
  type ConversationContactsResponse,
  type ConversationMember,
  type CreateConversation,
  type Message,
  type ConversationId,
  type UserId,
  type ConversationMemberRole,
} from '@armali/schemas'

export const messagingApi = {
  listConversations: async (): Promise<Conversation[]> => {
    const data = await http.get('/conversations')
    return conversationSchema.array().parse(data)
  },

  getContacts: async (): Promise<ConversationContactsResponse> => {
    const data = await http.get('/conversations/contacts')
    return conversationContactsResponseSchema.parse(data)
  },

  createConversation: async (payload: CreateConversation): Promise<Conversation> => {
    const data = await http.post('/conversations', payload)
    return conversationSchema.parse(data)
  },

  getConversation: async (
    id: ConversationId,
    params: { before?: string; limit?: number } = {},
  ): Promise<ConversationDetail> => {
    const query = new URLSearchParams()
    if (params.before) query.set('before', params.before)
    if (params.limit) query.set('limit', String(params.limit))
    const qs = query.toString()
    const data = await http.get(`/conversations/${id}${qs ? `?${qs}` : ''}`)
    return conversationDetailSchema.parse(data)
  },

  rename: async (id: ConversationId, name: string): Promise<Conversation> => {
    const data = await http.patch(`/conversations/${id}`, { name })
    return conversationSchema.parse(data)
  },

  addMembers: async (id: ConversationId, memberIds: UserId[]): Promise<Conversation> => {
    const data = await http.post(`/conversations/${id}/members`, { memberIds })
    return conversationSchema.parse(data)
  },

  removeMember: async (id: ConversationId, userId: UserId): Promise<void> => {
    await http.delete(`/conversations/${id}/members/${userId}`)
  },

  updateMemberRole: async (
    id: ConversationId,
    userId: UserId,
    role: ConversationMemberRole,
  ): Promise<ConversationMember> => {
    const data = await http.patch(`/conversations/${id}/members/${userId}`, { role })
    return conversationMemberSchema.parse(data)
  },

  sendMessage: async (id: ConversationId, content: string): Promise<Message> => {
    const data = await http.post(`/conversations/${id}/messages`, { content })
    return messageSchema.parse(data)
  },

  markRead: async (id: ConversationId): Promise<void> => {
    await http.post(`/conversations/${id}/read`, {})
  },
}
