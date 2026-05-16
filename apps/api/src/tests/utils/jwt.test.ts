import { describe, it, expect, vi } from "vitest";

import { UserId } from "@armali/schemas";
import { JwtPayload } from "@api/utils/jwt";

vi.stubEnv("JWT_ACCESS_SECRET", "test_access_secret");
vi.stubEnv("JWT_REFRESH_SECRET", "test_refresh_secret");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = await import("@api/utils/jwt");
const mockPayload: JwtPayload = {
  id: "user-1" as UserId,
  email: "test@test.com",
  role: "VETERINARIAN",
};

// ── generateAccessToken ───────────────────────────────────────────────────────

describe("generateAccessToken", () => {
  it("génère un token valide", () => {
    const token = generateAccessToken(mockPayload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("le token contient le bon payload", () => {
    const token = generateAccessToken(mockPayload);
    const decoded = verifyAccessToken(token);

    expect(decoded?.id).toBe(mockPayload.id);
    expect(decoded?.email).toBe(mockPayload.email);
    expect(decoded?.role).toBe(mockPayload.role);
  });
});

// ── generateRefreshToken ──────────────────────────────────────────────────────

describe("generateRefreshToken", () => {
  it("génère un token valide", () => {
    const token = generateRefreshToken(mockPayload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("le token contient le bon payload", () => {
    const token = generateRefreshToken(mockPayload);
    const decoded = verifyRefreshToken(token);

    expect(decoded?.id).toBe(mockPayload.id);
    expect(decoded?.email).toBe(mockPayload.email);
    expect(decoded?.role).toBe(mockPayload.role);
  });

  it("le refresh token est différent de l'access token", () => {
    const access = generateAccessToken(mockPayload);
    const refresh = generateRefreshToken(mockPayload);
    expect(access).not.toBe(refresh);
  });
});

// ── verifyAccessToken ─────────────────────────────────────────────────────────

describe("verifyAccessToken", () => {
  it("retourne le payload pour un token valide", () => {
    const token = generateAccessToken(mockPayload);
    const result = verifyAccessToken(token);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(mockPayload.id);
    expect(result?.role).toBe(mockPayload.role);
  });

  it("retourne null pour un token invalide", () => {
    const result = verifyAccessToken("token.invalide.ici");
    expect(result).toBeNull();
  });

  it("retourne null pour un token signé avec le mauvais secret", () => {
    const token = generateRefreshToken(mockPayload); // signé avec REFRESH_SECRET
    const result = verifyAccessToken(token); // vérifié avec ACCESS_SECRET
    expect(result).toBeNull();
  });

  it("retourne null pour un token vide", () => {
    const result = verifyAccessToken("");
    expect(result).toBeNull();
  });
});

// ── verifyRefreshToken ────────────────────────────────────────────────────────

describe("verifyRefreshToken", () => {
  it("retourne le payload pour un token valide", () => {
    const token = generateRefreshToken(mockPayload);
    const result = verifyRefreshToken(token);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(mockPayload.id);
    expect(result?.role).toBe(mockPayload.role);
  });

  it("retourne null pour un token invalide", () => {
    const result = verifyRefreshToken("token.invalide.ici");
    expect(result).toBeNull();
  });

  it("retourne null pour un token signé avec le mauvais secret", () => {
    const token = generateAccessToken(mockPayload);
    const result = verifyRefreshToken(token);
    expect(result).toBeNull();
  });

  it("retourne null pour un token vide", () => {
    const result = verifyRefreshToken("");
    expect(result).toBeNull();
  });
});
