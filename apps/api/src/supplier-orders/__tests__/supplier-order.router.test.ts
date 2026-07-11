import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";

describe("SupplierOrder router", () => {
  let referentToken: string;
  let clientToken: string;
  let supplierId: string;
  let pendingOrderId: string;

  beforeAll(async () => {
    referentToken = await loginAs("referent@gmail.com");
    clientToken = await loginAs("client@gmail.com");

    const suppliersRes = await request(app)
      .get("/api/suppliers")
      .set("Authorization", `Bearer ${referentToken}`);
    const supplierWithCatalog = suppliersRes.body.find(
      (s: any) => s.supplierProducts.length > 0,
    );
    if (!supplierWithCatalog) {
      throw new Error("Aucun fournisseur avec catalogue seedé pour les tests");
    }
    supplierId = supplierWithCatalog.id;

    const ordersRes = await request(app)
      .get("/api/supplier-orders?status=PENDING")
      .set("Authorization", `Bearer ${referentToken}`);
    if (ordersRes.body.length === 0) {
      throw new Error("Aucune commande fournisseur PENDING seedée pour les tests");
    }
    pendingOrderId = ordersRes.body[0].id;
  });

  describe("GET /api/supplier-orders", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/supplier-orders");
      expect(res.status).toBe(401);
    });

    it("403 — CLIENT n'a pas accès", async () => {
      const res = await request(app)
        .get("/api/supplier-orders")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });

    it("200 — REFERENT reçoit ses commandes avec le total calculé", async () => {
      const res = await request(app)
        .get("/api/supplier-orders")
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty("total");
    });

    it("200 — filtre par statut", async () => {
      const res = await request(app)
        .get("/api/supplier-orders?status=PENDING")
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.every((o: any) => o.status === "PENDING")).toBe(true);
    });
  });

  describe("POST /api/supplier-orders", () => {
    it("400 — body invalide (items vide)", async () => {
      const res = await request(app)
        .post("/api/supplier-orders")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ supplierId, items: [] });
      expect(res.status).toBe(400);
    });

    it("400 — budget insuffisant pour une quantité déraisonnable", async () => {
      const supplierRes = await request(app)
        .get(`/api/suppliers/${supplierId}`)
        .set("Authorization", `Bearer ${referentToken}`);
      const productId = supplierRes.body.supplierProducts[0].productId;

      const res = await request(app)
        .post("/api/supplier-orders")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ supplierId, items: [{ productId, quantity: 999999 }] });
      expect(res.status).toBe(400);
    });

    it("201 — REFERENT crée une commande, le budget est débité", async () => {
      const supplierRes = await request(app)
        .get(`/api/suppliers/${supplierId}`)
        .set("Authorization", `Bearer ${referentToken}`);
      const productId = supplierRes.body.supplierProducts[0].productId;

      const budgetBefore = await request(app)
        .get("/api/budget")
        .set("Authorization", `Bearer ${referentToken}`);

      const res = await request(app)
        .post("/api/supplier-orders")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ supplierId, items: [{ productId, quantity: 1 }] });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("PENDING");

      const budgetAfter = await request(app)
        .get("/api/budget")
        .set("Authorization", `Bearer ${referentToken}`);
      expect(budgetAfter.body.balance).toBe(budgetBefore.body.balance - res.body.total);
    });
  });

  describe("PATCH /api/supplier-orders/:id/receive", () => {
    it("403 — CLIENT ne peut pas marquer une commande reçue", async () => {
      const res = await request(app)
        .patch(`/api/supplier-orders/${pendingOrderId}/receive`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it("200 — REFERENT marque la commande reçue", async () => {
      const res = await request(app)
        .patch(`/api/supplier-orders/${pendingOrderId}/receive`)
        .set("Authorization", `Bearer ${referentToken}`)
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("RECEIVED");
    });

    it("400 — ne peut plus être reçue une seconde fois", async () => {
      const res = await request(app)
        .patch(`/api/supplier-orders/${pendingOrderId}/receive`)
        .set("Authorization", `Bearer ${referentToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/supplier-orders/:id/cancel", () => {
    it("200 — REFERENT annule une commande en attente, le budget est recrédité", async () => {
      const supplierRes = await request(app)
        .get(`/api/suppliers/${supplierId}`)
        .set("Authorization", `Bearer ${referentToken}`);
      const productId = supplierRes.body.supplierProducts[0].productId;

      const createRes = await request(app)
        .post("/api/supplier-orders")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ supplierId, items: [{ productId, quantity: 1 }] });
      const toCancelId = createRes.body.id;

      const budgetBefore = await request(app)
        .get("/api/budget")
        .set("Authorization", `Bearer ${referentToken}`);

      const res = await request(app)
        .patch(`/api/supplier-orders/${toCancelId}/cancel`)
        .set("Authorization", `Bearer ${referentToken}`)
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("CANCELLED");

      const budgetAfter = await request(app)
        .get("/api/budget")
        .set("Authorization", `Bearer ${referentToken}`);
      expect(budgetAfter.body.balance).toBe(
        budgetBefore.body.balance + createRes.body.total,
      );
    });
  });
});