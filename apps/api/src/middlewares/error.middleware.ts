import { ZodError } from "zod";
import type { NextFunction, Request, Response } from "express";
import { AppError, ValidationError } from "@api/errors";

const PRISMA_UNIQUE_MESSAGES: Record<string, string> = {
  email: "Cet email est déjà utilisé",
  siret: "Ce SIRET est déjà utilisé",
  token: "Token déjà utilisé",
};

function isPrismaError(err: unknown): err is { code: string; meta?: Record<string, unknown> } {
  return typeof err === "object" && err !== null && "code" in err;
}

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
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (isPrismaError(err)) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined) ?? [];
      const field = target.find((f) => f in PRISMA_UNIQUE_MESSAGES);
      return res.status(409).json({
        error: field ? PRISMA_UNIQUE_MESSAGES[field] : "Cette valeur est déjà utilisée",
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Ressource introuvable" });
    }
    if (err.code === "P2003") {
      return res.status(409).json({
        error:
          "Impossible d'effectuer cette action : cette ressource est encore liée à d'autres données",
      });
    }
  }

  console.error(err);
  return res.status(500).json({ error: "Erreur interne du serveur" });
}
