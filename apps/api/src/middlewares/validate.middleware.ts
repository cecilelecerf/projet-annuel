import type { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

export const validate =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        message: "Validation échouée",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
