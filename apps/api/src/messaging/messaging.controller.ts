import type { NextFunction, Response } from "express";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  addConversationMembersSchema,
  conversationDetailSchema,
  conversationSchema,
  type AddConversationMembers,
  type CreateConversation,
  type RenameConversation,
  type SendMessage,
  type UpdateConversationMemberRole,
} from "@armali/schemas";
import { MessagingService } from "./messaging.service";
import {
  emitToConversation,
  emitToUser,
  joinConversationRoom,
} from "./socket.gateway";

export class MessagingController {
  constructor(private service: MessagingService) {}

  async getContacts(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const contacts = await this.service.getContacts(req.user);
      res.status(200).json(contacts);
    } catch (err) {
      next(err);
    }
  }

  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const conversations = await this.service.listConversations(req.user.id);
      res.status(200).json(conversationSchema.array().parse(conversations));
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: AuthenticatedRequest & { body: CreateConversation },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const conversation = await this.service.createConversation(
        req.user,
        req.body,
      );
      conversation.conversationMembers.forEach((m) => {
        joinConversationRoom(m.userId, conversation.id);
        if (m.userId !== req.user.id) {
          emitToUser(m.userId, "conversation:new", conversation);
        }
      });
      res.status(201).json(conversation);
    } catch (err) {
      next(err);
    }
  }

  async getById(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const before =
        typeof req.query.before === "string" ? req.query.before : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const detail = await this.service.getConversation(
        req.params.id,
        req.user.id,
        { before, limit },
      );
      res.status(200).json(conversationDetailSchema.parse(detail));
    } catch (err) {
      next(err);
    }
  }

  async rename(
    req: RequestWithParams<{ id: string }> & { body: RenameConversation },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const conversation = await this.service.rename(
        req.params.id,
        req.user.id,
        req.body.name,
      );
      emitToConversation(req.params.id, "conversation:updated", conversation);
      res.status(200).json(conversation);
    } catch (err) {
      next(err);
    }
  }

  async addMembers(
    req: RequestWithParams<{ id: string }> & { body: AddConversationMembers },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const payload = addConversationMembersSchema.parse(req.body);
      const conversation = await this.service.addMembers(
        req.params.id,
        req.user.id,
        req.body.memberIds,
      );
      if (!conversation) throw new BadRequestError("Conversation introuvable");
      payload.memberIds.forEach((userId) => {
        joinConversationRoom(userId, req.params.id);
        emitToUser(userId, "conversation:new", conversation);
      });
      emitToConversation(req.params.id, "conversation:updated", conversation);
      res.status(200).json(conversation);
    } catch (err) {
      next(err);
    }
  }

  async removeMember(
    req: RequestWithParams<{ id: string; userId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await this.service.removeMember(
        req.params.id,
        req.user.id,
        req.params.userId,
      );
      emitToConversation(req.params.id, "conversation:member-removed", {
        conversationId: req.params.id,
        userId: req.params.userId,
      });
      res.status(204).json();
    } catch (err) {
      next(err);
    }
  }

  async updateMemberRole(
    req: RequestWithParams<{ id: string; userId: string }> & {
      body: UpdateConversationMemberRole;
    },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const member = await this.service.updateMemberRole(
        req.params.id,
        req.user.id,
        req.params.userId,
        req.body.role,
      );
      emitToConversation(req.params.id, "conversation:member-updated", member);
      res.status(200).json(member);
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(
    req: RequestWithParams<{ id: string }> & { body: SendMessage },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const message = await this.service.sendMessage(
        req.user,
        req.params.id,
        req.body.content,
      );
      emitToConversation(req.params.id, "message:new", message);
      res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  }

  async markRead(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await this.service.markRead(req.params.id, req.user.id);
      emitToConversation(req.params.id, "conversation:read", {
        conversationId: req.params.id,
        userId: req.user.id,
        readAt: new Date().toISOString(),
      });
      res.status(204).json();
    } catch (err) {
      next(err);
    }
  }
}
