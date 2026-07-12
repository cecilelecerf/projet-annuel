import type {
  ConversationMemberRole,
  ConversationScope,
} from "@armali/schemas";
import {
  conversationListInclude,
  conversationMembersInclude,
} from "./messaging.types";
import { PrismaClient } from "../../prisma/generated/prisma/client";

export class ConversationRepository {
  constructor(private prisma: PrismaClient) {}

  async findExistingDirect(userAId: string, userBId: string) {
    return this.prisma.conversation.findFirst({
      where: {
        type: "DIRECT",
        conversationMembers: { some: { userId: userAId } },
        AND: [{ conversationMembers: { some: { userId: userBId } } }],
      },
      include: conversationListInclude,
    });
  }

  async listForUser(userId: string) {
    return this.prisma.conversation.findMany({
      where: { conversationMembers: { some: { userId } } },
      orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
      include: conversationListInclude,
    });
  }

  async findById(conversationId: string) {
    return this.prisma.conversation.findUnique({
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
    return this.prisma.conversation.create({
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
    return this.prisma.conversation.create({
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
    await this.prisma.conversationMember.createMany({
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
    await this.prisma.conversationMember.delete({
      where: { conversationId_userId: { conversationId, userId } },
    });
  }

  async updateMemberRole(
    conversationId: string,
    userId: string,
    role: ConversationMemberRole,
  ) {
    return this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { role },
    });
  }

  async rename(conversationId: string, name: string) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { name },
    });
  }

  async touchLastMessageAt(conversationId: string, date: Date) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: date },
    });
  }

  async updateLastReadAt(conversationId: string, userId: string, date: Date) {
    return this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: date },
    });
  }

  async listConversationIdsForUser(userId: string) {
    const members = await this.prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    return members.map((m) => m.conversationId);
  }
}
