import type { NextFunction, Response } from "express";
import type {
  AuthenticatedRequest,
  RequestWithParams,
} from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  createProductRequestSchema,
  rejectProductRequestSchema,
  type CreateProductRequest,
  type RejectProductRequest,
} from "@armali/schemas";
import { ProductRequestService } from "./product-request.service";

export class ProductRequestController {
  constructor(private service: ProductRequestService) {}

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as
        | "PENDING"
        | "APPROVED"
        | "REJECTED"
        | undefined;
      const requests = await this.service.getAll(status, req.user.role);
      res.status(200).json(requests);
    } catch (err) {
      next(err);
    }
  }

  async getMine(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requests = await this.service.getMine(req.user.id, req.user.role);
      res.status(200).json(requests);
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: AuthenticatedRequest & { body: CreateProductRequest },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createProductRequestSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const request = await this.service.create(
        req.user.id,
        req.user.role,
        result.data,
      );
      res.status(201).json(request);
    } catch (err) {
      next(err);
    }
  }

  async approve(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const request = await this.service.approve(
        req.params.id,
        req.user.id,
        req.user.role,
      );
      res.status(200).json(request);
    } catch (err) {
      next(err);
    }
  }

  async reject(
    req: RequestWithParams<{ id: string }> & { body: RejectProductRequest },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = rejectProductRequestSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const request = await this.service.reject(
        req.params.id,
        req.user.id,
        req.user.role,
        result.data,
      );
      res.status(200).json(request);
    } catch (err) {
      next(err);
    }
  }
}