import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  actSchema,
  createActSchema,
  updateActSchema,
  type CreateAct,
  type UpdateAct,
} from "@armali/schemas";
import { ActService } from "./act.service";

export class ActController {
  constructor(private service: ActService) {}

  // ── Acts ──────────────────────────────────────────────────────────────────

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const acts = await this.service.getAll();
      res.status(200).json(actSchema.array().parse(acts));
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
      const act = await this.service.getById(req.params.id);
      res.status(200).json(actSchema.parse(act));
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
      const act = await this.service.create(result.data, req.user.role);
      res.status(201).json(actSchema.parse(act));
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
      const act = await this.service.update(
        req.params.id,
        result.data,
        req.user.role,
      );
      res.status(200).json(actSchema.parse(act));
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
      await this.service.delete(req.params.id, req.user.role);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
