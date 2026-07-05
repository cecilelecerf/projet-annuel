import { prisma } from "@api/lib/prisma";
import { messageInclude } from "./messaging.types";

export class MessageRepository {
  async create({
    conversationId,
    senderId,
    content,
  }: {
    conversationId: string;
    senderId: string;
    content: string;
  }) {
    return prisma.message.create({
      data: { conversationId, senderId, content },
      include: messageInclude,
    });
  }

  async listByConversation(
    conversationId: string,
    { before, limit = 30 }: { before?: string; limit?: number },
  ) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(before ? { cursor: { id: before }, skip: 1 } : {}),
      include: messageInclude,
    });
  }

  async countUnread(conversationId: string, since: Date | null) {
    return prisma.message.count({
      where: {
        conversationId,
        ...(since ? { createdAt: { gt: since } } : {}),
      },
    });
  }
}
