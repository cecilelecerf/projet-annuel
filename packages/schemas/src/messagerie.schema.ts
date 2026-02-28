import { z } from 'zod'
import { conversationIdSchema, conversationMemberIdSchema, messageIdSchema, messageReadIdSchema, userIdSchema } from './ids'

// ── Conversation ──────────────────────────────────────────────────────────────
export const conversationSchema = z.object({
  id:   conversationIdSchema,
  name: z.string().max(255).nullable().optional(),
})

export const createConversationSchema = conversationSchema.omit({ id: true })
export const updateConversationSchema = createConversationSchema.partial()

export type Conversation       = z.infer<typeof conversationSchema>
export type CreateConversation = z.infer<typeof createConversationSchema>
export type UpdateConversation = z.infer<typeof updateConversationSchema>

// ── ConversationMember ────────────────────────────────────────────────────────
export const conversationMemberRoleSchema = z.enum(['admin', 'member'])

export const conversationMemberSchema = z.object({
  id:             conversationMemberIdSchema,
  conversationId: conversationIdSchema,
  userId:         userIdSchema,
  joinedAt:       z.string().datetime(),
  role:           conversationMemberRoleSchema,
})

export const createConversationMemberSchema = conversationMemberSchema.omit({ id: true })
export const updateConversationMemberSchema = createConversationMemberSchema.partial()

export type ConversationMemberRole   = z.infer<typeof conversationMemberRoleSchema>
export type ConversationMember       = z.infer<typeof conversationMemberSchema>
export type CreateConversationMember = z.infer<typeof createConversationMemberSchema>
export type UpdateConversationMember = z.infer<typeof updateConversationMemberSchema>

// ── Message ───────────────────────────────────────────────────────────────────
export const messageSchema = z.object({
  id:             messageIdSchema,
  conversationId: conversationIdSchema,
  senderId:       conversationMemberIdSchema, // FK → conversation_member.id
  content:        z.string().min(1),
})

export const createMessageSchema = messageSchema.omit({ id: true })

export type Message       = z.infer<typeof messageSchema>
export type CreateMessage = z.infer<typeof createMessageSchema>

// ── MessageRead ───────────────────────────────────────────────────────────────
export const messageReadSchema = z.object({
  id:                   messageReadIdSchema,
  messageId:            messageIdSchema,
  conversationMemberId: conversationMemberIdSchema,
  readAt:               z.string().datetime().nullable().optional(),
})

export const createMessageReadSchema = messageReadSchema.omit({ id: true })

export type MessageRead       = z.infer<typeof messageReadSchema>
export type CreateMessageRead = z.infer<typeof createMessageReadSchema>
