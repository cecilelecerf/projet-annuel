import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";

describe("Brand router", () => {
  let adminToken: string;
  let referentToken: string;
  let brandId: string;

  beforeAll(async () => {
    adminToken = await loginAs("admin@gmail.com");
    referentToken = await loginAs("referent@gmail.com");

    // Crée une marque de référence via l'API elle-même pour les tests de lecture
    const createRes = await request(app)
      .post("/api/brands")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Marque Test ${Date.now()}` });

    if (createRes.status !== 201) {
      throw new Error(
        `Impossible de créer la marque de référence : ${createRes.status} ${JSON.stringify(createRes.body)}`,
      );
    }
    brandId = createRes.body.id;
  });

  // ── GET /api/brands ───────────────────────────────────────────────────────

  describe("GET /api/brands", () => {
    it("200 — ADMIN reçoit la liste", async () => {
      const res = await request(app)
        .get("/api/brands")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("200 — REFERENT peut lister/rechercher (utile pour ses demandes)", async () => {
      const res = await request(app)
        .get("/api/brands")
        .set("Authorization", `Bearer ${referentToken}`);

      expect(res.status).toBe(200);
    });

    it("401 — sans token", async () => {
      const res = await request(app).get("/api/brands");
      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/brands/:id ───────────────────────────────────────────────────

  describe("GET /api/brands/:id", () => {
    it("200 — retourne la marque", async () => {
      const res = await request(app)
        .get(`/api/brands/${brandId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(brandId);
    });

    it("404 — marque inexistante", async () => {
      const res = await request(app)
        .get("/api/brands/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/brands ──────────────────────────────────────────────────────

  describe("POST /api/brands", () => {
    it("401 — sans token", async () => {
      const res = await request(app).post("/api/brands").send({});
      expect(res.status).toBe(401);
    });

    it("403 — REFERENT ne peut pas créer de marque (catalogue admin-only)", async () => {
      const res = await request(app)
        .post("/api/brands")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ name: "Tentative référent" });

      expect(res.status).toBe(403);
    });

    it("400 — body invalide (name manquant)", async () => {
      const res = await request(app)
        .post("/api/brands")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("201 — ADMIN crée une marque", async () => {
      const res = await request(app)
        .post("/api/brands")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: `Nouvelle Marque ${Date.now()}` });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });
  });

  // ── PATCH /api/brands/:id ─────────────────────────────────────────────────

  describe("PATCH /api/brands/:id", () => {
    it("403 — REFERENT ne peut pas modifier une marque", async () => {
      const res = await request(app)
        .patch(`/api/brands/${brandId}`)
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ name: "Tentative" });

      expect(res.status).toBe(403);
    });

    it("200 — ADMIN modifie la marque", async () => {
      const res = await request(app)
        .patch(`/api/brands/${brandId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Nom modifié" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Nom modifié");
    });

    it("404 — marque inexistante", async () => {
      const res = await request(app)
        .patch("/api/brands/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "X" });

      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/brands/:id ────────────────────────────────────────────────

  describe("DELETE /api/brands/:id", () => {
    it("403 — REFERENT ne peut pas supprimer une marque", async () => {
      const res = await request(app)
        .delete(`/api/brands/${brandId}`)
        .set("Authorization", `Bearer ${referentToken}`);

      expect(res.status).toBe(403);
    });

    it("204 — ADMIN supprime une marque jetable", async () => {
      const createRes = await request(app)
        .post("/api/brands")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: `Jetable ${Date.now()}` });
      expect(createRes.status).toBe(201);
      const disposableId = createRes.body.id;

      const res = await request(app)
        .delete(`/api/brands/${disposableId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });

    it("404 — marque inexistante", async () => {
      const res = await request(app)
        .delete("/api/brands/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});