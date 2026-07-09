import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";

describe("ProductRequest router", () => {
  let adminToken: string;
  let referentToken: string;
  let clientToken: string;
  let requestId: string;

  beforeAll(async () => {
    adminToken = await loginAs("admin@gmail.com");
    referentToken = await loginAs("referent@gmail.com");
    clientToken = await loginAs("client@gmail.com");

    // Crée une demande de référence via l'API pour les tests d'approbation/rejet
    const createRes = await request(app)
      .post("/api/product-requests")
      .set("Authorization", `Bearer ${referentToken}`)
      .send({
        name: `Produit Test ${Date.now()}`,
        newBrandName: `Marque Test ${Date.now()}`,
      });

    if (createRes.status !== 201) {
      throw new Error(
        `Impossible de créer la demande de référence : ${createRes.status} ${JSON.stringify(createRes.body)}`,
      );
    }
    requestId = createRes.body.id;
  });

  // ── GET /api/product-requests (admin) ────────────────────────────────────

  describe("GET /api/product-requests", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/product-requests");
      expect(res.status).toBe(401);
    });

    it("403 — REFERENT n'a pas accès à la liste globale", async () => {
      const res = await request(app)
        .get("/api/product-requests")
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(403);
    });

    it("200 — ADMIN reçoit toutes les demandes", async () => {
      const res = await request(app)
        .get("/api/product-requests")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("200 — ADMIN peut filtrer par statut", async () => {
      const res = await request(app)
        .get("/api/product-requests?status=PENDING")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(
        res.body.every((r: any) => r.status === "PENDING"),
      ).toBe(true);
    });
  });

  // ── GET /api/product-requests/mine ───────────────────────────────────────

  describe("GET /api/product-requests/mine", () => {
    it("403 — CLIENT n'a pas accès", async () => {
      const res = await request(app)
        .get("/api/product-requests/mine")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });

    it("200 — REFERENT reçoit les demandes de sa clinique", async () => {
      const res = await request(app)
        .get("/api/product-requests/mine")
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── POST /api/product-requests ───────────────────────────────────────────

  describe("POST /api/product-requests", () => {
    it("401 — sans token", async () => {
      const res = await request(app).post("/api/product-requests").send({});
      expect(res.status).toBe(401);
    });

    it("403 — CLIENT ne peut pas faire de demande", async () => {
      const res = await request(app)
        .post("/api/product-requests")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ name: "X", newBrandName: "Y" });
      expect(res.status).toBe(403);
    });

    it("400 — body invalide (ni brandId ni newBrandName)", async () => {
      const res = await request(app)
        .post("/api/product-requests")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ name: "Produit sans marque" });
      expect(res.status).toBe(400);
    });

    it("201 — REFERENT crée une demande", async () => {
      const res = await request(app)
        .post("/api/product-requests")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({
          name: `Autre Produit ${Date.now()}`,
          newBrandName: `Autre Marque ${Date.now()}`,
        });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe("PENDING");
    });
  });

  // ── PATCH /api/product-requests/:id/approve ──────────────────────────────

  describe("PATCH /api/product-requests/:id/approve", () => {
    it("403 — REFERENT ne peut pas approuver", async () => {
      const res = await request(app)
        .patch(`/api/product-requests/${requestId}/approve`)
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(403);
    });

    it("404 — demande inexistante", async () => {
      const res = await request(app)
        .patch("/api/product-requests/00000000-0000-4000-8000-000000000000/approve")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("200 — ADMIN approuve, la demande passe APPROVED et un produit est créé", async () => {
      const res = await request(app)
        .patch(`/api/product-requests/${requestId}/approve`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("APPROVED");
      expect(res.body.createdProductId).toBeTruthy();
    });

    it("400 — approuver une demande déjà traitée échoue", async () => {
      const res = await request(app)
        .patch(`/api/product-requests/${requestId}/approve`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
    });
  });

  // ── PATCH /api/product-requests/:id/reject ───────────────────────────────

  describe("PATCH /api/product-requests/:id/reject", () => {
    it("403 — REFERENT ne peut pas rejeter", async () => {
      const res = await request(app)
        .patch(`/api/product-requests/${requestId}/reject`)
        .set("Authorization", `Bearer ${referentToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it("200 — ADMIN rejette une demande encore en attente", async () => {
      const createRes = await request(app)
        .post("/api/product-requests")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({
          name: `À rejeter ${Date.now()}`,
          newBrandName: `Marque Rejet ${Date.now()}`,
        });
      const toRejectId = createRes.body.id;

      const res = await request(app)
        .patch(`/api/product-requests/${toRejectId}/reject`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ rejectionReason: "Déjà au catalogue" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("REJECTED");
      expect(res.body.rejectionReason).toBe("Déjà au catalogue");
    });

    it("404 — demande inexistante", async () => {
      const res = await request(app)
        .patch("/api/product-requests/00000000-0000-4000-8000-000000000000/reject")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(404);
    });
  });
});