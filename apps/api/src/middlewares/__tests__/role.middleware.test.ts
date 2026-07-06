import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { roleMiddleware } from "@api/middlewares/role.middleware";

const mockRes = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const next: NextFunction = vi.fn();

beforeEach(() => vi.clearAllMocks());

describe("roleMiddleware", () => {
  it("401 — sans req.user", () => {
    const req = {} as Request;
    const res = mockRes();

    roleMiddleware(["VETERINARIAN"])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Non authentifié" });
    expect(next).not.toHaveBeenCalled();
  });

  it("403 — rôle non autorisé", () => {
    const req = { user: { id: "1", email: "t@t.com", role: "CLIENT" } } as any;
    const res = mockRes();

    roleMiddleware(["VETERINARIAN", "SECRETARY"])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Accès interdit" });
    expect(next).not.toHaveBeenCalled();
  });

  it("appelle next si le rôle est autorisé", () => {
    const req = {
      user: { id: "1", email: "t@t.com", role: "VETERINARIAN" },
    } as any;
    const res = mockRes();

    roleMiddleware(["VETERINARIAN", "SECRETARY"])(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("appelle next pour n'importe quel rôle dans la liste", () => {
    const roles = ["ADMIN", "DIRECTOR", "REFERENT"] as const;

    for (const role of roles) {
      const req = { user: { id: "1", email: "t@t.com", role } } as any;
      const res = mockRes();
      const nextFn = vi.fn();

      roleMiddleware(["ADMIN", "DIRECTOR", "REFERENT"])(req, res, nextFn);

      expect(nextFn).toHaveBeenCalled();
    }
  });
});
