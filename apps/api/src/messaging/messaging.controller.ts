import type { NextFunction, Response } from "express";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import type {
  AddConversationMembers,
  CreateConversation,
  RenameConversation,
  SendMessage,
  UpdateConversationMemberRole,
} from "@armali/schemas";
import { MessagingService } from "./messaging.service";
import {
  emitToConversation,
  emitToUser,
  joinConversationRoom,
} from "./socket.gateway";

const messagingService = new MessagingService();

export class MessagingController {
  async getContacts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const contacts = await messagingService.getContacts(req.user);
      res.status(200).json(contacts);
    } catch (err) {
      next(err);
    }
  }

  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const conversations = await messagingService.listConversations(
        req.user.id,
      );
      res.status(200).json(conversations);
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
      const conversation = await messagingService.createConversation(
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
      const detail = await messagingService.getConversation(
        req.params.id,
        req.user.id,
        { before, limit },
      );
      res.status(200).json(detail);
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
      const conversation = await messagingService.rename(
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
      const conversation = await messagingService.addMembers(
        req.params.id,
        req.user.id,
        req.body.memberIds,
      );
      if (!conversation) throw new BadRequestError("Conversation introuvable");
      req.body.memberIds.forEach((userId) => {
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
      await messagingService.removeMember(
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
      const member = await messagingService.updateMemberRole(
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
      const message = await messagingService.sendMessage(
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
      await messagingService.markRead(req.params.id, req.user.id);
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
