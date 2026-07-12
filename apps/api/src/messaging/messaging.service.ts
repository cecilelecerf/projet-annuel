import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import type { JwtPayload } from "@api/utils";
import type {
  ConversationMemberRole,
  ConversationScope,
  CreateConversation,
} from "@armali/schemas";
import { ConversationRepository } from "./conversation.repository";
import { MessageRepository } from "./message.repository";
import { UserRepository } from "@api/users/user.repository";
import { VeterinarianProfileRepository } from "@api/veterinarians/veterinarian-profile.repository";
import { withAvatarUrl, withUsersAvatar } from "@api/users/user.utils";

export class MessagingService {
  constructor(
    private repository: MessageRepository,
    private conversationRepository: ConversationRepository,
    private userRepository: UserRepository,
    private veterinarianProfileRepository: VeterinarianProfileRepository,
  ) {}

  private async resolveActorClinicIds(actor: JwtPayload): Promise<string[]> {
    if (actor.role === "VETERINARIAN") {
      return this.veterinarianProfileRepository.findClinicIds(actor.id);
    }
    return actor.clinicId ? [actor.clinicId] : [];
  }

  private async resolveClinicSets(userIds: string[]) {
    const users = await this.userRepository.findWithClinicIds(userIds);
    if (users.length !== userIds.length) throw new NotFoundError("Utilisateur");
    return users;
  }

  private async assertMembersEligible({
    scope,
    clinicId,
    actorClinicIds,
    memberIds,
  }: {
    scope: ConversationScope;
    clinicId: string | null;
    actorClinicIds: string[];
    memberIds: string[];
  }) {
    const members = await this.resolveClinicSets(memberIds);

    const eligible =
      scope === "DIRECTOR_NETWORK"
        ? members.every((m) => m.role === "DIRECTOR")
        : scope === "VETERINARIAN_NETWORK"
          ? members.every(
              (m) =>
                m.role === "VETERINARIAN" &&
                m.clinicIds.some((id) => actorClinicIds.includes(id)),
            )
          : members.every(
              (m) => clinicId !== null && m.clinicIds.includes(clinicId),
            );
    if (!eligible) throw new ForbiddenError();
  }

  private async getMember(conversationId: string, userId: string) {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundError("Conversation");
    const member = conversation.conversationMembers.find(
      (m) => m.userId === userId,
    );
    if (!member) throw new ForbiddenError();
    return {
      conversation: {
        ...conversation,
        conversationMembers: withUsersAvatar(conversation.conversationMembers),
      },
      member: { ...member, user: withAvatarUrl(member.user) },
    };
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

  private formatConversation<
    T extends { conversationMembers: Parameters<typeof withUsersAvatar>[0] },
  >(conversation: T) {
    return {
      ...conversation,
      conversationMembers: withUsersAvatar(conversation.conversationMembers),
    };
  }

  // ── Contacts disponibles pour démarrer une conversation ─────────────────────
  async getContacts(actor: JwtPayload) {
    const clinicIds = await this.resolveActorClinicIds(actor);
    if (clinicIds.length === 0) throw new ForbiddenError();

    const clinic = (
      await this.userRepository.findClinicColleagues(clinicIds, actor.id)
    ).map(withAvatarUrl);
    if (actor.role !== "DIRECTOR") return { clinic };
    const directors = (await this.userRepository.findDirectors(actor.id)).map(
      withAvatarUrl,
    );
    return { clinic, directors };
  }

  async listConversations(userId: string) {
    const conversations = await this.conversationRepository.listForUser(userId);
    return Promise.all(
      conversations.map(async (conversation) => {
        const me = conversation.conversationMembers.find(
          (m) => m.userId === userId,
        );
        const unreadCount = await this.repository.countUnread(
          conversation.id,
          userId,
          me?.lastReadAt ?? null,
        );
        const { messages, ...rest } = conversation;

        const lastMessage = messages[0] ?? null;
        return {
          ...rest,
          conversationMembers: rest.conversationMembers.map((member) => ({
            ...member,
            user: withAvatarUrl(member.user),
          })),
          lastMessage: {
            ...lastMessage,
            sender: withAvatarUrl(lastMessage.sender),
          },
          unreadCount,
        };
      }),
    );
  }

  async createConversation(actor: JwtPayload, data: CreateConversation) {
    if (data.type === "DIRECT") {
      if (actor.id === data.userId) {
        throw new BadRequestError("Impossible de discuter avec soi-même");
      }

      const existing = await this.conversationRepository.findExistingDirect(
        actor.id,
        data.userId,
      );
      if (existing) return this.formatConversation(existing);

      const [target] = await this.userRepository.findWithClinicIds([
        data.userId,
      ]);
      if (!target) throw new NotFoundError("Utilisateur");

      const actorClinicIds = await this.resolveActorClinicIds(actor);
      const sharedClinicId =
        actorClinicIds.find((id) => target.clinicIds.includes(id)) ?? null;

      let scope: ConversationScope;
      let clinicId: string | null = null;
      if (sharedClinicId) {
        scope = "CLINIC";
        clinicId = sharedClinicId;
      } else if (actor.role === "DIRECTOR" && target.role === "DIRECTOR") {
        scope = "DIRECTOR_NETWORK";
      } else if (
        actor.role === "VETERINARIAN" &&
        target.role === "VETERINARIAN"
      ) {
        scope = "VETERINARIAN_NETWORK";
      } else {
        throw new ForbiddenError();
      }

      return this.formatConversation(
        await this.conversationRepository.createDirect({
          createdById: actor.id,
          otherUserId: data.userId,
          scope,
          clinicId,
        }),
      );
    }

    // ── Groupe ──────────────────────────────────────────────────────────────
    if (data.scope === "DIRECTOR_NETWORK" && actor.role !== "DIRECTOR") {
      throw new ForbiddenError();
    }
    if (
      data.scope === "VETERINARIAN_NETWORK" &&
      actor.role !== "VETERINARIAN"
    ) {
      throw new ForbiddenError();
    }

    const actorClinicIds = await this.resolveActorClinicIds(actor);

    let clinicId: string | null = null;
    if (data.scope === "CLINIC") {
      if (!data.clinicId || !actorClinicIds.includes(data.clinicId)) {
        throw new ForbiddenError();
      }
      clinicId = data.clinicId;
    }

    await this.assertMembersEligible({
      scope: data.scope,
      clinicId,
      actorClinicIds,
      memberIds: data.memberIds,
    });

    return this.formatConversation(
      await this.conversationRepository.createGroup({
        createdById: actor.id,
        name: data.name,
        scope: data.scope,
        clinicId,
        memberIds: data.memberIds,
      }),
    );
  }

  async getConversation(
    conversationId: string,
    userId: string,
    pagination: { before?: string; limit?: number },
  ) {
    const { conversation } = await this.getMember(conversationId, userId);
    const limit = pagination.limit ?? 30;
    const page = await this.repository.listByConversation(conversationId, {
      ...pagination,
      limit,
    });
    const pageFormat = page.map((p) => ({
      ...p,
      sender: withAvatarUrl(p.sender),
    }));
    const hasMore = pageFormat.length > limit;
    return {
      conversation,
      messages: hasMore ? pageFormat.slice(0, limit) : pageFormat,
      hasMore,
    };
  }

  async sendMessage(
    actor: JwtPayload,
    conversationId: string,
    content: string,
  ) {
    await this.assertIsMember(conversationId, actor.id);
    const message = await this.repository.create({
      conversationId,
      senderId: actor.id,
      content,
    });
    await this.conversationRepository.touchLastMessageAt(
      conversationId,
      message.createdAt,
    );
    await this.conversationRepository.updateLastReadAt(
      conversationId,
      actor.id,
      message.createdAt,
    );
    return message;
  }

  async markRead(conversationId: string, userId: string) {
    await this.assertIsMember(conversationId, userId);
    return this.conversationRepository.updateLastReadAt(
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
    return this.conversationRepository.rename(conversationId, name);
  }

  async addMembers(
    conversationId: string,
    actorId: string,
    actorRole: JwtPayload["role"],
    memberIds: string[],
  ) {
    const conversation = await this.assertIsAdmin(conversationId, actorId);
    if (conversation.type !== "GROUP") {
      throw new BadRequestError(
        "Impossible d'ajouter des membres à une discussion privée",
      );
    }
    const actorClinicIds = await this.resolveActorClinicIds({
      id: actorId,
      role: actorRole,
    } as JwtPayload);
    await this.assertMembersEligible({
      scope: conversation.scope,
      clinicId: conversation.clinicId,
      actorClinicIds,
      memberIds,
    });
    const updated = await this.conversationRepository.addMembers(
      conversationId,
      memberIds,
    );
    return updated ? this.formatConversation(updated) : null;
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

    return this.conversationRepository.removeMember(
      conversationId,
      targetUserId,
    );
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
    return this.conversationRepository.updateMemberRole(
      conversationId,
      targetUserId,
      role,
    );
  }

  async listConversationIdsForUser(userId: string) {
    return this.conversationRepository.listConversationIdsForUser(userId);
  }
}
