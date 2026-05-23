import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  createActSchema,
  updateActSchema,
  createClinicActSchema,
  updateClinicActSchema,
  type CreateAct,
  type UpdateAct,
  type CreateClinicAct,
  type UpdateClinicAct,
} from "@armali/schemas";
import { ActService } from "./act.service";

const actService = new ActService();

export class ActController {
  // ── Acts ──────────────────────────────────────────────────────────────────

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const acts = await actService.getAll();
      res.status(200).json(acts);
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
      const act = await actService.getById(req.params.id);
      res.status(200).json(act);
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: AuthenticatedRequest & { body: CreateAct },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createActSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const act = await actService.create(result.data, req.user.role);
      res.status(201).json(act);
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: RequestWithParams<{ id: string }> & { body: UpdateAct },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updateActSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const act = await actService.update(
        req.params.id,
        result.data,
        req.user.role,
      );
      res.status(200).json(act);
    } catch (err) {
      next(err);
    }
  }

  async delete(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await actService.delete(req.params.id, req.user.role);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
  async getByMeeting(
    req: RequestWithParams<{ meetingId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const acts = await actService.getByMeeting(req.params.meetingId);
      res.status(200).json(acts);
    } catch (err) {
      next(err);
    }
  }
  // ── ClinicActs ────────────────────────────────────────────────────────────

  async getClinicActs(
    req: RequestWithParams<{ clinicId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const acts = await actService.getClinicActs(req.params.clinicId);
      res.status(200).json(acts);
    } catch (err) {
      next(err);
    }
  }

  async getClinicActById(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const act = await actService.getClinicActById(req.params.id);
      res.status(200).json(act);
    } catch (err) {
      next(err);
    }
  }

  async createClinicAct(
    req: AuthenticatedRequest & { body: CreateClinicAct },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createClinicActSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const act = await actService.createClinicAct(result.data, req.user.role);
      res.status(201).json(act);
    } catch (err) {
      next(err);
    }
  }

  async updateClinicAct(
    req: RequestWithParams<{ id: string }> & { body: UpdateClinicAct },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updateClinicActSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const act = await actService.updateClinicAct(
        req.params.id,
        result.data,
        req.user.role,
      );
      res.status(200).json(act);
    } catch (err) {
      next(err);
    }
  }

  async deleteClinicAct(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await actService.deleteClinicAct(req.params.id, req.user.role);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
