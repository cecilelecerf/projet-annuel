import { prisma } from "@api/lib/prisma";
import type {
  ConversationMemberRole,
  ConversationScope,
} from "@armali/schemas";
import {
  conversationListInclude,
  conversationMembersInclude,
} from "./messaging.types";

export class ConversationRepository {
  async findExistingDirect(userAId: string, userBId: string) {
    return prisma.conversation.findFirst({
      where: {
        type: "DIRECT",
        conversationMembers: { some: { userId: userAId } },
        AND: [{ conversationMembers: { some: { userId: userBId } } }],
      },
      include: conversationListInclude,
    });
  }

  async listForUser(userId: string) {
    return prisma.conversation.findMany({
      where: { conversationMembers: { some: { userId } } },
      orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
      include: conversationListInclude,
    });
  }

  async findById(conversationId: string) {
    return prisma.conversation.findUnique({
      where: { id: conversationId },
      include: conversationMembersInclude,
    });
  }

  async createDirect({
    createdById,
    otherUserId,
    scope,
    clinicId,
  }: {
    createdById: string;
    otherUserId: string;
    scope: ConversationScope;
    clinicId: string | null;
  }) {
    return prisma.conversation.create({
      data: {
        type: "DIRECT",
        scope,
        clinicId,
        createdById,
        conversationMembers: {
          createMany: {
            data: [
              { userId: createdById, role: "ADMIN" },
              { userId: otherUserId, role: "ADMIN" },
            ],
          },
        },
      },
      include: conversationListInclude,
    });
  }

  async createGroup({
    createdById,
    name,
    scope,
    clinicId,
    memberIds,
  }: {
    createdById: string;
    name: string;
    scope: ConversationScope;
    clinicId: string | null;
    memberIds: string[];
  }) {
    return prisma.conversation.create({
      data: {
        type: "GROUP",
        scope,
        name,
        clinicId,
        createdById,
        conversationMembers: {
          createMany: {
            data: [
              { userId: createdById, role: "ADMIN" },
              ...memberIds.map((userId) => ({
                userId,
                role: "MEMBER" as const,
              })),
            ],
          },
        },
      },
      include: conversationListInclude,
    });
  }

  async addMembers(conversationId: string, memberIds: string[]) {
    await prisma.conversationMember.createMany({
      data: memberIds.map((userId) => ({
        conversationId,
        userId,
        role: "MEMBER" as const,
      })),
      skipDuplicates: true,
    });
    return this.findById(conversationId);
  }

  async removeMember(conversationId: string, userId: string) {
    await prisma.conversationMember.delete({
      where: { conversationId_userId: { conversationId, userId } },
    });
  }

  async updateMemberRole(
    conversationId: string,
    userId: string,
    role: ConversationMemberRole,
  ) {
    return prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { role },
    });
  }

  async rename(conversationId: string, name: string) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: { name },
    });
  }

  async touchLastMessageAt(conversationId: string, date: Date) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: date },
    });
  }

  async updateLastReadAt(conversationId: string, userId: string, date: Date) {
    return prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: date },
    });
  }

  async listConversationIdsForUser(userId: string) {
    const members = await prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    return members.map((m) => m.conversationId);
  }
}
