import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";

describe("Order router", () => {
  let clientToken: string;
  let secretaryToken: string;
  let referentToken: string;

  beforeAll(async () => {
    clientToken = await loginAs("client@gmail.com");
    secretaryToken = await loginAs("secretaire@gmail.com");
    referentToken = await loginAs("referent@gmail.com");
  });

  // ── POST /api/orders/checkout ────────────────────────────────────────────
  describe("POST /api/orders/checkout", () => {
    it("401 — sans token", async () => {
      const res = await request(app).post("/api/orders/checkout").send({});
      expect(res.status).toBe(401);
    });

    it("403 — SECRETARY ne peut pas passer commande", async () => {
      const res = await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${secretaryToken}`)
        .send({ groups: [] });
      expect(res.status).toBe(403);
    });

    it("400 — body invalide (groups manquant)", async () => {
      const res = await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it("400 — groupe sans clinique accessible au client", async () => {
      const res = await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({
          groups: [
            {
              clinicId: "00000000-0000-4000-8000-000000000000",
              items: [
                {
                  productClinicId: "00000000-0000-4000-8000-000000000001",
                  quantity: 1,
                },
              ],
            },
          ],
        });
      // Clinique inconnue du client → 403 (ForbiddenError) selon le service
      expect(res.status).toBe(403);
    });
  });

  // ── GET /api/orders/mine ─────────────────────────────────────────────────

  describe("GET /api/orders/mine", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/orders/mine");
      expect(res.status).toBe(401);
    });

    it("403 — SECRETARY n'a pas accès à /mine (réservé au client)", async () => {
      const res = await request(app)
        .get("/api/orders/mine")
        .set("Authorization", `Bearer ${secretaryToken}`);
      expect(res.status).toBe(403);
    });

    it("200 — CLIENT reçoit la liste de ses commandes", async () => {
      const res = await request(app)
        .get("/api/orders/mine")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── GET /api/orders/:id ───────────────────────────────────────────────────

  describe("GET /api/orders/:id", () => {
    it("404 — commande inexistante", async () => {
      const res = await request(app)
        .get("/api/orders/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(404);
    });

    it("403 — SECRETARY ne peut pas consulter une commande via cette route (réservée au client)", async () => {
      const res = await request(app)
        .get("/api/orders/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${secretaryToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── GET /api/orders/clinic/pending ───────────────────────────────────────

  describe("GET /api/orders/clinic/pending", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/orders/clinic/pending");
      expect(res.status).toBe(401);
    });

    it("403 — CLIENT n'a pas accès à la liste clinique", async () => {
      const res = await request(app)
        .get("/api/orders/clinic/pending")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });

    it("403 — REFERENT n'a pas accès (réservé à la secrétaire)", async () => {
      const res = await request(app)
        .get("/api/orders/clinic/pending")
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(403);
    });

    it("200 — SECRETARY reçoit les commandes à préparer/récupérer de sa clinique", async () => {
      const res = await request(app)
        .get("/api/orders/clinic/pending")
        .set("Authorization", `Bearer ${secretaryToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── PATCH /api/orders/:id/ready ──────────────────────────────────────────

  describe("PATCH /api/orders/:id/ready", () => {
    it("403 — CLIENT ne peut pas préparer une commande", async () => {
      const res = await request(app)
        .patch("/api/orders/00000000-0000-4000-8000-000000000000/ready")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });

    it("400 — commande inexistante (ou pas CONFIRMED)", async () => {
      const res = await request(app)
        .patch("/api/orders/00000000-0000-4000-8000-000000000000/ready")
        .set("Authorization", `Bearer ${secretaryToken}`);
      expect(res.status).toBe(400);
    });
  });

  // ── POST /api/orders/deliver ──────────────────────────────────────────────

  describe("POST /api/orders/deliver", () => {
    it("403 — CLIENT ne peut pas remettre de colis", async () => {
      const res = await request(app)
        .post("/api/orders/deliver")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ pickupCode: "ABC123" });
      expect(res.status).toBe(403);
    });

    it("400 — body invalide (pickupCode manquant)", async () => {
      const res = await request(app)
        .post("/api/orders/deliver")
        .set("Authorization", `Bearer ${secretaryToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it("404 — code de retrait inconnu", async () => {
      const res = await request(app)
        .post("/api/orders/deliver")
        .set("Authorization", `Bearer ${secretaryToken}`)
        .send({ pickupCode: "ZZZZZZ" });
      expect(res.status).toBe(404);
    });
  });
});