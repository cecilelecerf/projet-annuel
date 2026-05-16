import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import z, { ZodError, ZodIssue } from "zod";
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
} from "@api/errors";
import { errorHandler } from "@api/middlewares/error.middleware";

const mockReq = {} as Request;
const mockNext = vi.fn() as NextFunction;

const mockRes = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => vi.clearAllMocks());

describe("errorHandler", () => {
  it("422 — ZodError natif", () => {
    const schema = z.object({ email: z.string() });
    let err!: ZodError;

    try {
      schema.parse({});
    } catch (e) {
      err = e as ZodError;
    }

    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: "Validation failed",
      issues: err.issues,
    });
  });
  it("422 — ValidationError", () => {
    const err = new ValidationError({ email: ["Email invalide"] });
    const res = mockRes();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: "Validation failed",
      issues: { email: ["Email invalide"] },
    });
  });

  it("404 — NotFoundError", () => {
    const err = new NotFoundError("Utilisateur");
    const res = mockRes();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("401 — UnauthorizedError", () => {
    const err = new UnauthorizedError("Token invalide");
    const res = mockRes();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("409 — ConflictError", () => {
    const err = new ConflictError("Email déjà utilisé");
    const res = mockRes();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("500 — erreur inconnue", () => {
    const err = new Error("Erreur inattendue");
    const res = mockRes();
    vi.spyOn(console, "error").mockImplementation(() => {});

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
