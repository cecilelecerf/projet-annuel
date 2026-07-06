import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import type { JwtPayload } from "@api/utils";
import type {
  ConversationMemberRole,
  ConversationScope,
  CreateConversation,
} from "@armali/schemas";
import { ConversationRepository } from "./conversation.repository";
import { MessageRepository } from "./message.repository";
import { ContactsRepository } from "./contacts.repository";

const conversationRepository = new ConversationRepository();
const messageRepository = new MessageRepository();
const contactsRepository = new ContactsRepository();

export class MessagingService {
  private async resolveClinicSets(userIds: string[]) {
    const users = await contactsRepository.findUsersWithClinicIds(userIds);
    if (users.length !== userIds.length) throw new NotFoundError("Utilisateur");
    return users;
  }

  private async assertMembersEligible({
    scope,
    clinicId,
    memberIds,
  }: {
    scope: ConversationScope;
    clinicId: string | null;
    memberIds: string[];
  }) {
    const members = await this.resolveClinicSets(memberIds);
    const eligible =
      scope === "DIRECTOR_NETWORK"
        ? members.every((m) => m.role === "DIRECTOR")
        : members.every((m) => clinicId !== null && m.clinicIds.includes(clinicId));
    if (!eligible) throw new ForbiddenError();
  }

  private async getMember(conversationId: string, userId: string) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundError("Conversation");
    const member = conversation.conversationMembers.find(
      (m) => m.userId === userId,
    );
    if (!member) throw new ForbiddenError();
    return { conversation, member };
  }

  private async assertIsMember(conversationId: string, userId: string) {
    return this.getMember(conversationId, userId);
  }

  private async assertIsAdmin(conversationId: string, userId: string) {
    const { conversation, member } = await this.getMember(
      conversationId,
      userId,
    );
    if (member.role !== "ADMIN") throw new ForbiddenError();
    return conversation;
  }

  async getContacts(actor: JwtPayload) {
    if (!actor.clinicId) throw new ForbiddenError();
    const clinic = await contactsRepository.listClinicColleagues(
      actor.clinicId,
      actor.id,
    );
    if (actor.role !== "DIRECTOR") return { clinic };
    const directors = await contactsRepository.listDirectors(actor.id);
    return { clinic, directors };
  }

  async listConversations(userId: string) {
    const conversations = await conversationRepository.listForUser(userId);
    return Promise.all(
      conversations.map(async (conversation) => {
        const me = conversation.conversationMembers.find(
          (m) => m.userId === userId,
        );
        const unreadCount = await messageRepository.countUnread(
          conversation.id,
          me?.lastReadAt ?? null,
        );
        const { messages, ...rest } = conversation;
        return { ...rest, lastMessage: messages[0] ?? null, unreadCount };
      }),
    );
  }

  async createConversation(actor: JwtPayload, data: CreateConversation) {
    if (data.type === "DIRECT") {
      if (actor.id === data.userId) {
        throw new BadRequestError("Impossible de discuter avec soi-même");
      }

      const existing = await conversationRepository.findExistingDirect(
        actor.id,
        data.userId,
      );
      if (existing) return existing;

      const [target] = await contactsRepository.findUsersWithClinicIds([
        data.userId,
      ]);
      if (!target) throw new NotFoundError("Utilisateur");

      let scope: ConversationScope;
      let clinicId: string | null = null;
      if (actor.clinicId && target.clinicIds.includes(actor.clinicId)) {
        scope = "CLINIC";
        clinicId = actor.clinicId;
      } else if (actor.role === "DIRECTOR" && target.role === "DIRECTOR") {
        scope = "DIRECTOR_NETWORK";
      } else {
        throw new ForbiddenError();
      }

      return conversationRepository.createDirect({
        createdById: actor.id,
        otherUserId: data.userId,
        scope,
        clinicId,
      });
    }

    if (data.scope === "DIRECTOR_NETWORK" && actor.role !== "DIRECTOR") {
      throw new ForbiddenError();
    }
    if (data.scope === "CLINIC" && !actor.clinicId) throw new ForbiddenError();

    const clinicId = data.scope === "CLINIC" ? (actor.clinicId as string) : null;
    await this.assertMembersEligible({
      scope: data.scope,
      clinicId,
      memberIds: data.memberIds,
    });

    return conversationRepository.createGroup({
      createdById: actor.id,
      name: data.name,
      scope: data.scope,
      clinicId,
      memberIds: data.memberIds,
    });
  }

  async getConversation(
    conversationId: string,
    userId: string,
    pagination: { before?: string; limit?: number },
  ) {
    const { conversation } = await this.getMember(conversationId, userId);
    const limit = pagination.limit ?? 30;
    const page = await messageRepository.listByConversation(conversationId, {
      ...pagination,
      limit,
    });
    const hasMore = page.length > limit;
    return {
      conversation,
      messages: hasMore ? page.slice(0, limit) : page,
      hasMore,
    };
  }

  async sendMessage(actor: JwtPayload, conversationId: string, content: string) {
    await this.assertIsMember(conversationId, actor.id);
    const message = await messageRepository.create({
      conversationId,
      senderId: actor.id,
      content,
    });
    await conversationRepository.touchLastMessageAt(
      conversationId,
      message.createdAt,
    );
    return message;
  }

  async markRead(conversationId: string, userId: string) {
    await this.assertIsMember(conversationId, userId);
    return conversationRepository.updateLastReadAt(
      conversationId,
      userId,
      new Date(),
    );
  }

  async rename(conversationId: string, userId: string, name: string) {
    const conversation = await this.assertIsAdmin(conversationId, userId);
    if (conversation.type !== "GROUP") {
      throw new BadRequestError("Seuls les groupes peuvent être renommés");
    }
    return conversationRepository.rename(conversationId, name);
  }

  async addMembers(
    conversationId: string,
    actorId: string,
    memberIds: string[],
  ) {
    const conversation = await this.assertIsAdmin(conversationId, actorId);
    if (conversation.type !== "GROUP") {
      throw new BadRequestError(
        "Impossible d'ajouter des membres à une discussion privée",
      );
    }
    await this.assertMembersEligible({
      scope: conversation.scope,
      clinicId: conversation.clinicId,
      memberIds,
    });
    return conversationRepository.addMembers(conversationId, memberIds);
  }

  async removeMember(
    conversationId: string,
    actorId: string,
    targetUserId: string,
  ) {
    const { conversation, member: actorMember } = await this.getMember(
      conversationId,
      actorId,
    );
    if (conversation.type !== "GROUP") {
      throw new BadRequestError("Impossible de quitter une discussion privée");
    }
    const isSelf = actorId === targetUserId;
    if (!isSelf && actorMember.role !== "ADMIN") throw new ForbiddenError();

    return conversationRepository.removeMember(conversationId, targetUserId);
  }

  async updateMemberRole(
    conversationId: string,
    actorId: string,
    targetUserId: string,
    role: ConversationMemberRole,
  ) {
    const conversation = await this.assertIsAdmin(conversationId, actorId);
    if (conversation.type !== "GROUP") {
      throw new BadRequestError("Seuls les groupes ont des administrateurs");
    }
    return conversationRepository.updateMemberRole(
      conversationId,
      targetUserId,
      role,
    );
  }

  async listConversationIdsForUser(userId: string) {
    return conversationRepository.listConversationIdsForUser(userId);
  }
}
