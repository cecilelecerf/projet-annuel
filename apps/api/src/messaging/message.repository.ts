import { messageInclude } from "./messaging.types";
import { PrismaClient } from "../../prisma/generated/prisma/client";

export class MessageRepository {
  constructor(private prisma: PrismaClient) {}

  async create({
    conversationId,
    senderId,
    content,
  }: {
    conversationId: string;
    senderId: string;
    content: string;
  }) {
    return this.prisma.message.create({
      data: { conversationId, senderId, content },
      include: messageInclude,
    });
  }

  async listByConversation(
    conversationId: string,
    { before, limit = 30 }: { before?: string; limit?: number },
  ) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(before ? { cursor: { id: before }, skip: 1 } : {}),
      include: messageInclude,
    });
  }

  async countUnread(conversationId: string, since: Date | null) {
    return this.prisma.message.count({
      where: {
        conversationId,
        ...(since ? { createdAt: { gt: since } } : {}),
      },
    });
  }
}
