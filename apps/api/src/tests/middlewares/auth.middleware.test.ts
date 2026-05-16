import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";

vi.mock("@api/utils/jwt", () => ({
  verifyAccessToken: vi.fn(),
}));

const { authMiddleware } = await import("@api/middlewares/auth.middleware");
const { verifyAccessToken } = await import("@api/utils/jwt");

const mockRes = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockReq = (headers: Record<string, string> = {}) =>
  ({ headers }) as unknown as Request;

const next: NextFunction = vi.fn();

beforeEach(() => vi.clearAllMocks());

describe("authMiddleware", () => {
  it("401 — sans header Authorization", () => {
    const req = mockReq();
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token manquant" });
    expect(next).not.toHaveBeenCalled();
  });

  it("401 — header sans préfixe Bearer", () => {
    const req = mockReq({ authorization: "Basic abc123" });
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token manquant" });
    expect(next).not.toHaveBeenCalled();
  });

  it("401 — token invalide", () => {
    vi.mocked(verifyAccessToken).mockReturnValue(null);

    const req = mockReq({ authorization: "Bearer invalid_token" });
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Token invalide ou expiré",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("appelle next et attache req.user si le token est valide", () => {
    const payload = { id: "1", email: "test@test.com", role: "VETERINARIAN" };
    vi.mocked(verifyAccessToken).mockReturnValue(payload as never);

    const req = mockReq({ authorization: "Bearer valid_token" }) as any;
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(payload);
    expect(res.status).not.toHaveBeenCalled();
  });
});
