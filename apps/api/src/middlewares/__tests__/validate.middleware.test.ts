import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { validate } from "@api/middlewares/validate.middleware";
import { z } from "zod";

const testSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

const mockRes = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const next: NextFunction = vi.fn();

beforeEach(() => vi.clearAllMocks());

describe("validate middleware", () => {
  it("400 — body invalide", () => {
    const req = {
      body: { email: "not-an-email", password: "short" },
    } as Request;
    const res = mockRes();

    validate(testSchema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Validation échouée" }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("400 — body vide", () => {
    const req = { body: {} } as Request;
    const res = mockRes();

    validate(testSchema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("400 — champs manquants avec les bons fieldErrors", () => {
    const req = { body: { email: "not-an-email" } } as Request;
    const res = mockRes();

    validate(testSchema)(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.objectContaining({
          email: expect.any(Array),
          password: expect.any(Array),
        }),
      }),
    );
  });

  it("appelle next et remplace req.body si le body est valide", () => {
    const body = { email: "test@test.com", password: "Password1!" };
    const req = { body } as Request;
    const res = mockRes();

    validate(testSchema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual(body);
    expect(res.status).not.toHaveBeenCalled();
  });
});
