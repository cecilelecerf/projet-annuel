import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
import { getPrisma } from "../../../__tests__/setup";

describe("Act router", () => {
  let adminToken: string;
  let directorToken: string;
  let referentToken: string;
  let vetToken: string;
  let secretaryToken: string;
  let clientToken: string;
  let actId: string;

  beforeAll(async () => {
    adminToken = await loginAs("admin@gmail.com");
    directorToken = await loginAs("directeur@gmail.com");
    referentToken = await loginAs("referent@gmail.com");
    vetToken = await loginAs("veto@gmail.com");
    secretaryToken = await loginAs("secretaire@gmail.com");
    clientToken = await loginAs("client@gmail.com");

    const prisma = getPrisma();
    const act = await prisma.act.findFirst({ where: { type: "ANALYSIS" } });
    if (!act) throw new Error("Aucun acte seedé pour les tests");
    actId = act.id;
  });

  // ── GET /api/acts ────────────────────────────────────────────────────────

  describe("GET /api/acts", () => {
    it("200 — ADMIN reçoit la liste des actes", async () => {
      const res = await request(app)
        .get("/api/acts")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("200 — DIRECTOR reçoit la liste des actes", async () => {
      const res = await request(app)
        .get("/api/acts")
        .set("Authorization", `Bearer ${directorToken}`);
      expect(res.status).toBe(200);
    });

    it("200 — REFERENT reçoit la liste des actes", async () => {
      const res = await request(app)
        .get("/api/acts")
        .query({
          type: [
            "SURGERY",
            "HOSPITALIZATION",
            "IMAGING",
            "ANALYSIS",
            "NURSING",
            "CONSULTATION",
          ],
        })
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(200);
    });
    it("200 — CLIENT reçoit la liste des actes", async () => {
      const res = await request(app)
        .get("/api/acts")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(200);
    });
    it("200 — VETERINARIAN reçoit la liste des actes", async () => {
      const res = await request(app)
        .get("/api/acts")
        .set("Authorization", `Bearer ${vetToken}`);
      expect(res.status).toBe(200);
    });

    it("200 — SECRETARY reçoit la liste des actes", async () => {
      const res = await request(app)
        .get("/api/acts")
        .set("Authorization", `Bearer ${secretaryToken}`);
      expect(res.status).toBe(200);
    });

    it("401 — sans token", async () => {
      const res = await request(app).get("/api/acts");
      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/acts/:id ────────────────────────────────────────────────────

  describe("GET /api/acts/:id", () => {
    it("200 — ADMIN reçoit l'acte", async () => {
      const res = await request(app)
        .get(`/api/acts/${actId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(actId);
    });

    it("200 — VETERINARIAN reçoit l'acte", async () => {
      const res = await request(app)
        .get(`/api/acts/${actId}`)
        .set("Authorization", `Bearer ${vetToken}`);
      expect(res.status).toBe(200);
    });

    it("200 — SECRETARY reçoit l'acte", async () => {
      const res = await request(app)
        .get(`/api/acts/${actId}`)
        .set("Authorization", `Bearer ${secretaryToken}`);
      expect(res.status).toBe(200);
    });

    it("404 — acte inexistant", async () => {
      const res = await request(app)
        .get("/api/acts/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("403 — CLIENT n'est pas staff", async () => {
      const res = await request(app)
        .get(`/api/acts/${actId}`)
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── POST /api/acts ───────────────────────────────────────────────────────

  describe("POST /api/acts", () => {
    it("401 — sans token", async () => {
      const res = await request(app).post("/api/acts").send({});
      expect(res.status).toBe(401);
    });

    it("403 — DIRECTOR ne peut pas créer d'acte global", async () => {
      const res = await request(app)
        .post("/api/acts")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it("201 — ADMIN crée un acte", async () => {
      const res = await request(app)
        .post("/api/acts")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: `Acte test ${Date.now()}`,
          description: "Description de test",
          type: "CONSULTATION",
          basePrice: 45.5,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.type).toBe("CONSULTATION");
    });
  });

  // ── PATCH /api/acts/:id ──────────────────────────────────────────────────

  describe("PATCH /api/acts/:id", () => {
    it("403 — DIRECTOR ne peut pas modifier un acte global", async () => {
      const res = await request(app)
        .patch(`/api/acts/${actId}`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ name: "Nouveau nom" });
      expect(res.status).toBe(403);
    });

    it("200 — ADMIN modifie un acte", async () => {
      const res = await request(app)
        .patch(`/api/acts/${actId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Consultation modifiée" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Consultation modifiée");
    });

    it("404 — acte inexistant", async () => {
      const res = await request(app)
        .patch("/api/acts/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "X" });
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/acts/:id ─────────────────────────────────────────────────

  describe("DELETE /api/acts/:id", () => {
    it("403 — DIRECTOR ne peut pas supprimer un acte global", async () => {
      const res = await request(app)
        .delete(`/api/acts/${actId}`)
        .set("Authorization", `Bearer ${directorToken}`);
      expect(res.status).toBe(403);
    });

    it("204 — ADMIN supprime un acte", async () => {
      const prisma = getPrisma();
      const disposable = await prisma.act.create({
        data: {
          name: `Acte jetable ${Date.now()}`,
          description: "À supprimer",
          type: "CONSULTATION",
          basePrice: 10,
        },
      });

      const res = await request(app)
        .delete(`/api/acts/${disposable.id}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(204);

      const check = await prisma.act.findUnique({
        where: { id: disposable.id },
      });
      expect(check).toBeNull();
    });
  });
});
