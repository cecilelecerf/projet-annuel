import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  createClinicActSchema,
  updateClinicActSchema,
  type CreateClinicAct,
  type UpdateClinicAct,
  ClinicId,
  ClinicActId,
} from "@armali/schemas";
import { ClinicActService } from "./clinic-act.service";

export class ClinicActController {
  constructor(private service: ClinicActService) {}

  // ── ClinicActs ────────────────────────────────────────────────────────────

  async getClinicActs(
    req: RequestWithParams<{ id: ClinicId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const acts = await this.service.getClinicActs(req.params.id);
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
      const act = await this.service.getClinicActById(req.params.id);
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
      const act = await this.service.createClinicAct(
        result.data,
        req.user.role,
        req.user.id,
      );
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
      const act = await this.service.updateClinicAct(
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
    req: RequestWithParams<{ id: ClinicActId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await this.service.deleteClinicAct(req.params.id, req.user.role);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
