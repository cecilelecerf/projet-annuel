import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";

describe("Supplier router", () => {
  let adminToken: string;
  let referentToken: string;
  let clientToken: string;
  let supplierId: string;

  beforeAll(async () => {
    adminToken = await loginAs("admin@gmail.com");
    referentToken = await loginAs("referent@gmail.com");
    clientToken = await loginAs("client@gmail.com");

    const res = await request(app)
      .get("/api/suppliers")
      .set("Authorization", `Bearer ${adminToken}`);
    if (res.status !== 200 || res.body.length === 0) {
      throw new Error("Aucun fournisseur seedé pour les tests");
    }
    supplierId = res.body[0].id;
  });

  describe("GET /api/suppliers", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/suppliers");
      expect(res.status).toBe(401);
    });

    it("403 — CLIENT n'a pas accès au catalogue fournisseurs", async () => {
      const res = await request(app)
        .get("/api/suppliers")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });

    it("200 — REFERENT peut consulter (lecture seule)", async () => {
      const res = await request(app)
        .get("/api/suppliers")
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("200 — ADMIN peut consulter", async () => {
      const res = await request(app)
        .get("/api/suppliers")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/suppliers", () => {
    it("403 — REFERENT ne peut pas créer de fournisseur (catalogue admin-only)", async () => {
      const res = await request(app)
        .post("/api/suppliers")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ name: "Tentative" });
      expect(res.status).toBe(403);
    });

    it("201 — ADMIN crée un fournisseur", async () => {
      const res = await request(app)
        .post("/api/suppliers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: `Fournisseur Test ${Date.now()}` });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });
  });

  describe("PATCH /api/suppliers/:id", () => {
    it("403 — REFERENT ne peut pas modifier", async () => {
      const res = await request(app)
        .patch(`/api/suppliers/${supplierId}`)
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ name: "Tentative" });
      expect(res.status).toBe(403);
    });

    it("200 — ADMIN modifie le fournisseur", async () => {
      const res = await request(app)
        .patch(`/api/suppliers/${supplierId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ phone: "0600000000" });
      expect(res.status).toBe(200);
      expect(res.body.phone).toBe("0600000000");
    });
  });

  describe("Gestion du catalogue produits (POST/PATCH/DELETE /:id/products)", () => {
    it("403 — REFERENT ne peut pas ajouter un prix d'achat", async () => {
      const res = await request(app)
        .post(`/api/suppliers/${supplierId}/products`)
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ productId: "00000000-0000-4000-8000-000000000000", costPrice: 5 });
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/suppliers/:id", () => {
    it("403 — REFERENT ne peut pas supprimer", async () => {
      const res = await request(app)
        .delete(`/api/suppliers/${supplierId}`)
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(403);
    });

    it("204 — ADMIN supprime un fournisseur jetable", async () => {
      const createRes = await request(app)
        .post("/api/suppliers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: `Jetable ${Date.now()}` });
      expect(createRes.status).toBe(201);

      const res = await request(app)
        .delete(`/api/suppliers/${createRes.body.id}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });
  });
});