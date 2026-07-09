import type { Request, Response, NextFunction } from "express";
import { BadRequestError } from "@api/errors";
import { creditBudgetSchema, budgetSummarySchema } from "@armali/schemas";
import { BudgetService } from "./budget.service";

export class BudgetController {
  constructor(private service: BudgetService) {}

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await this.service.getSummary(
        req.user!.id,
        req.user!.role,
      );
      res.status(200).json(budgetSummarySchema.parse(summary));
    } catch (err) {
      next(err);
    }
  }

  async credit(req: Request, res: Response, next: NextFunction) {
    try {
      const result = creditBudgetSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const transaction = await this.service.credit(
        req.user!.id,
        req.user!.role,
        result.data,
      );
      res.status(201).json(transaction);
    } catch (err) {
      next(err);
    }
  }
}