import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
import { getPrisma } from "../../../__tests__/setup";

describe("Product router", () => {
  let adminToken: string;
  let referentToken: string;
  let clientToken: string;
  let productId: string;
  let clinicId: string;
  let clinicProductId: string;

  beforeAll(async () => {
    adminToken = await loginAs("admin@gmail.com");
    referentToken = await loginAs("referent@gmail.com");
    clientToken = await loginAs("client@gmail.com");

    const prisma = getPrisma();
    const referentUser = await prisma.user.findUnique({
      where: { email: "referent@gmail.com" },
    });
    if (!referentUser) throw new Error("referent@gmail.com introuvable");
    const referentProfile = await prisma.referentClinicProfile.findUnique({
      where: { id: referentUser.id },
    });
    if (!referentProfile)
      throw new Error("Aucun ReferentClinicProfile seedé pour ce compte");
    clinicId = referentProfile.clinicId;

    // Crée un produit catalogue de référence (admin-only)
    const brandRes = await request(app)
      .post("/api/brands")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Marque Produit Test ${Date.now()}` });
    if (brandRes.status !== 201) {
      throw new Error(`Impossible de créer la marque : ${brandRes.status}`);
    }

    const createRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Produit Test ${Date.now()}`, brandId: brandRes.body.id });
    if (createRes.status !== 201) {
      throw new Error(
        `Impossible de créer le produit de référence : ${createRes.status} ${JSON.stringify(createRes.body)}`,
      );
    }
    productId = createRes.body.id;

    // Ajoute ce produit au stock de la clinique du référent
    const clinicProductRes = await request(app)
      .post("/api/products/clinic-products")
      .set("Authorization", `Bearer ${referentToken}`)
      .send({
        clinicId,
        productId,
        stock: 10,
        minimumRequired: 3,
        price: 19.9,
      });
    if (clinicProductRes.status !== 201) {
      throw new Error(
        `Impossible de créer le produit clinique de référence : ${clinicProductRes.status} ${JSON.stringify(clinicProductRes.body)}`,
      );
    }
    clinicProductId = clinicProductRes.body.id;
  });

  // ── GET /api/products ─────────────────────────────────────────────────────

  describe("GET /api/products", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/products");
      expect(res.status).toBe(401);
    });

    it("200 — le staff reçoit le catalogue", async () => {
      const res = await request(app)
        .get("/api/products")
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("GET /api/products/:id", () => {
    it("200 — retourne le produit", async () => {
      const res = await request(app)
        .get(`/api/products/${productId}`)
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(productId);
    });

    it("404 — produit inexistant", async () => {
      const res = await request(app)
        .get("/api/products/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/products (catalogue admin-only) ────────────────────────────

  describe("POST /api/products", () => {
    it("403 — REFERENT ne peut pas créer de produit catalogue", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ name: "Tentative", brandId: "00000000-0000-4000-8000-000000000000" });
      expect(res.status).toBe(403);
    });

    it("400 — body invalide (name manquant)", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // ── PATCH / DELETE /api/products/:id (admin-only) ────────────────────────

  describe("PATCH /api/products/:id", () => {
    it("403 — REFERENT ne peut pas modifier le catalogue", async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}`)
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ name: "Tentative" });
      expect(res.status).toBe(403);
    });

    it("200 — ADMIN modifie le produit", async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Nom modifié" });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Nom modifié");
    });
  });

  // ── Stock clinique ────────────────────────────────────────────────────────

  describe("GET /api/products/clinic-products/:clinicId", () => {
    it("200 — retourne le stock de la clinique", async () => {
      const res = await request(app)
        .get(`/api/products/clinic-products/${clinicId}`)
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("GET /api/products/clinic-products/:clinicId/low-stock", () => {
    it("200 — ne retourne que les produits sous le seuil minimum", async () => {
      const res = await request(app)
        .get(`/api/products/clinic-products/${clinicId}/low-stock`)
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(200);
      expect(
        res.body.every((p: any) => p.stock <= p.minimumRequired),
      ).toBe(true);
    });
  });

  describe("GET /api/products/clinic-products/detail/:id", () => {
    it("200 — retourne le détail du produit clinique", async () => {
      const res = await request(app)
        .get(`/api/products/clinic-products/detail/${clinicProductId}`)
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(clinicProductId);
    });

    it("404 — produit clinique inexistant", async () => {
      const res = await request(app)
        .get("/api/products/clinic-products/detail/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/products/clinic-products", () => {
    it("403 — CLIENT ne peut pas gérer le stock", async () => {
      const res = await request(app)
        .post("/api/products/clinic-products")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ clinicId, productId, stock: 1, minimumRequired: 1, price: 1 });
      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/products/clinic-products/:id", () => {
    it("200 — REFERENT met à jour le minimum requis", async () => {
      const res = await request(app)
        .patch(`/api/products/clinic-products/${clinicProductId}`)
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ minimumRequired: 7 });
      expect(res.status).toBe(200);
      expect(res.body.minimumRequired).toBe(7);
    });

    it("404 — produit clinique inexistant", async () => {
      const res = await request(app)
        .patch("/api/products/clinic-products/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ minimumRequired: 1 });
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/products/clinic-products/:id/restock", () => {
    it("403 — CLIENT ne peut pas réapprovisionner", async () => {
      const res = await request(app)
        .patch(`/api/products/clinic-products/${clinicProductId}/restock`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ quantity: 5 });
      expect(res.status).toBe(403);
    });

    it("200 — REFERENT incrémente le stock", async () => {
      const before = await request(app)
        .get(`/api/products/clinic-products/detail/${clinicProductId}`)
        .set("Authorization", `Bearer ${referentToken}`);
      const stockBefore = before.body.stock;

      const res = await request(app)
        .patch(`/api/products/clinic-products/${clinicProductId}/restock`)
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(200);
      expect(res.body.stock).toBe(stockBefore + 5);
    });
  });

  describe("DELETE /api/products/clinic-products/:id", () => {
    it("403 — CLIENT ne peut pas supprimer un produit clinique", async () => {
      const res = await request(app)
        .delete(`/api/products/clinic-products/${clinicProductId}`)
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });

    it("204 — REFERENT supprime un produit clinique jetable", async () => {
      const createRes = await request(app)
        .post("/api/products/clinic-products")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({
          clinicId,
          productId,
          stock: 1,
          minimumRequired: 1,
          price: 5,
        });
      expect(createRes.status).toBe(201);
      const disposableId = createRes.body.id;

      const res = await request(app)
        .delete(`/api/products/clinic-products/${disposableId}`)
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(204);
    });
  });
});