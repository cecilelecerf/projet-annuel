import { ZodError } from "zod";
import type { NextFunction, Request, Response } from "express";
import { AppError, ValidationError } from "@api/errors";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: "Validation failed",
      issues: err.issues,
    });
  }

  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      error: err.message,
      issues: err.issues,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
