import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { getPrisma } from "../../../../__tests__/setup";

const validQuery = "startDate=2026-01-01&endDate=2026-12-31";

const loginAs = async (email: string, password = "Password123!") => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res.body.accessToken as string;
};

// ── POST /api/meetings/internal ───────────────────────────────────────────────

describe("POST /api/meetings/internal", () => {
  it("401 — sans token", async () => {
    const res = await request(app).post("/api/meetings/internal");
    expect(res.status).toBe(401);
  });

  it("403 — rôle CLIENT non autorisé", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .post("/api/meetings/internal")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("400 — body invalide", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .post("/api/meetings/internal")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("201 — SECRETARY crée une réunion interne", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const veto = await getPrisma().user.findUnique({
      where: { email: "veto@gmail.com" },
    });

    const res = await request(app)
      .post("/api/meetings/internal")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-06-15",
        startTime: "1970-01-01T14:00:00.000Z",
        endTime: "1970-01-01T15:00:00.000Z",
        title: "Réunion test",
        userIds: [veto!.id],
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });
});

// ── DELETE /api/meetings/internal/:id ─────────────────────────────────────────

describe("DELETE /api/meetings/internal/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).delete("/api/meetings/internal/some-id");
    expect(res.status).toBe(401);
  });
  it("403 — N'est pas l'admin", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const veto = await getPrisma().user.findUnique({
      where: { email: "veto@gmail.com" },
    });

    const created = await request(app)
      .post("/api/meetings/internal")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-08-01",
        startTime: "1970-01-01T10:31:00.000Z",
        endTime: "1970-01-01T11:00:00.000Z",
        title: "À supprimer",
        userIds: [veto!.id],
      });

    const tokenVeto = await loginAs("veto@gmail.com");
    const res = await request(app)
      .delete(`/api/meetings/internal/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenVeto}`);
    expect(res.status).toBe(403);
  });
  it("204 — SECRETARY supprime une réunion interne", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const veto = await getPrisma().user.findUnique({
      where: { email: "veto@gmail.com" },
    });

    const created = await request(app)
      .post("/api/meetings/internal")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-08-01",
        startTime: "1970-01-01T10:00:00.000Z",
        endTime: "1970-01-01T11:00:00.000Z",
        title: "À supprimer",
        userIds: [veto!.id],
      });

    const res = await request(app)
      .delete(`/api/meetings/internal/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});
