import { z } from "zod";
import {
  clinicIdSchema,
  conversationIdSchema,
  conversationMemberIdSchema,
  messageIdSchema,
  userIdSchema,
} from "./ids";
import { baseUserSchema } from "./users/base-user.schema";

// ── Conversation ──────────────────────────────────────────────────────────────
export const conversationTypeSchema = z.enum(["DIRECT", "GROUP"]);
export const conversationScopeSchema = z.enum(["CLINIC", "DIRECTOR_NETWORK"]);
export const conversationMemberRoleSchema = z.enum(["ADMIN", "MEMBER"]);

export type ConversationType = z.infer<typeof conversationTypeSchema>;
export type ConversationScope = z.infer<typeof conversationScopeSchema>;
export type ConversationMemberRole = z.infer<
  typeof conversationMemberRoleSchema
>;

export const conversationMemberSchema = z.object({
  id: conversationMemberIdSchema,
  conversationId: conversationIdSchema,
  userId: userIdSchema,
  role: conversationMemberRoleSchema,
  joinedAt: z.coerce.date(),
  lastReadAt: z.coerce.date().nullable(),
  user: baseUserSchema
    .pick({
      id: true,
      firstname: true,
      lastname: true,
      avatarUrl: true,
      role: true,
    })
    .optional(),
});
export type ConversationMember = z.infer<typeof conversationMemberSchema>;

export const messageSchema = z.object({
  id: messageIdSchema,
  conversationId: conversationIdSchema,
  senderId: userIdSchema,
  content: z.string().min(1),
  createdAt: z.coerce.date(),
  sender: baseUserSchema
    .pick({ id: true, firstname: true, lastname: true, avatarUrl: true })
    .optional(),
});
export type Message = z.infer<typeof messageSchema>;

export const conversationSchema = z.object({
  id: conversationIdSchema,
  type: conversationTypeSchema,
  scope: conversationScopeSchema,
  name: z.string().max(255).nullable(),
  clinicId: clinicIdSchema.nullable(),
  createdById: userIdSchema,
  lastMessageAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  conversationMembers: z.array(conversationMemberSchema).optional(),
  lastMessage: messageSchema.nullable().optional(),
  unreadCount: z.number().int().nonnegative().optional(),
});
export type Conversation = z.infer<typeof conversationSchema>;

export const conversationDetailSchema = z.object({
  conversation: conversationSchema,
  messages: z.array(messageSchema),
  hasMore: z.boolean(),
});
export type ConversationDetail = z.infer<typeof conversationDetailSchema>;

// ── Payloads ──────────────────────────────────────────────────────────────────
export const createDirectConversationSchema = z.object({
  type: z.literal("DIRECT"),
  userId: userIdSchema,
});
export type CreateDirectConversation = z.infer<
  typeof createDirectConversationSchema
>;

export const createGroupConversationSchema = z.object({
  type: z.literal("GROUP"),
  scope: conversationScopeSchema,
  name: z.string().min(1).max(255),
  memberIds: z.array(userIdSchema).min(2),
});
export type CreateGroupConversation = z.infer<
  typeof createGroupConversationSchema
>;

export const createConversationSchema = z.discriminatedUnion("type", [
  createDirectConversationSchema,
  createGroupConversationSchema,
]);
export type CreateConversation = z.infer<typeof createConversationSchema>;

export const renameConversationSchema = z.object({
  name: z.string().min(1).max(255),
});
export type RenameConversation = z.infer<typeof renameConversationSchema>;

export const addConversationMembersSchema = z.object({
  memberIds: z.array(userIdSchema).min(1),
});
export type AddConversationMembers = z.infer<
  typeof addConversationMembersSchema
>;

export const updateConversationMemberRoleSchema = z.object({
  role: conversationMemberRoleSchema,
});
export type UpdateConversationMemberRole = z.infer<
  typeof updateConversationMemberRoleSchema
>;

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});
export type SendMessage = z.infer<typeof sendMessageSchema>;

// ── Contacts (personnes/directeurs éligibles pour démarrer une discussion) ─────
export const conversationContactSchema = baseUserSchema.pick({
  id: true,
  firstname: true,
  lastname: true,
  avatarUrl: true,
  role: true,
});
export type ConversationContact = z.infer<typeof conversationContactSchema>;

export const conversationContactsResponseSchema = z.object({
  clinic: z.array(conversationContactSchema),
  directors: z.array(conversationContactSchema).optional(),
});
export type ConversationContactsResponse = z.infer<
  typeof conversationContactsResponseSchema
>;
