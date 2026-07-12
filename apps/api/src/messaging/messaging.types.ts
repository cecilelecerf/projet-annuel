import type { Prisma } from "../../prisma/generated/prisma/client";

export const conversationMemberUserSelect = {
  id: true,
  firstname: true,
  lastname: true,
  role: true,
  avatar: true,
} satisfies Prisma.UserSelect;

export const messageInclude = {
  sender: { select: conversationMemberUserSelect },
} satisfies Prisma.MessageInclude;

export const conversationMembersInclude = {
  conversationMembers: {
    include: { user: { select: conversationMemberUserSelect } },
  },
} satisfies Prisma.ConversationInclude;

export const conversationListInclude = {
  ...conversationMembersInclude,
  messages: {
    orderBy: { createdAt: "desc" },
    take: 1,
    include: messageInclude,
  },
} satisfies Prisma.ConversationInclude;
