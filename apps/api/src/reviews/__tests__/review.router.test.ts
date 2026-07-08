import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
import { getPrisma } from "../../../__tests__/setup";

describe("Review router", () => {
  let clientToken: string;
  let vetClinicId: string;

  beforeAll(async () => {
    clientToken = await loginAs("client@gmail.com");

    const prisma = getPrisma();
    const vetClinic = await prisma.veterinarianClinic.findFirst();
    if (!vetClinic)
      throw new Error("Aucune association véto/clinique seedée pour les tests");
    vetClinicId = vetClinic.id;
  });

  // ── POST / ────────────────────────────────────────────────────────────────

  describe("POST /api/reviews", () => {
    it("200 — CLIENT crée un avis", async () => {
      const res = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({
          veterinarianClinicId: vetClinicId,
          rating: 5,
          comment: "Très bon suivi",
        });

      expect(res.status).toBe(200);
      expect(res.body.rating).toBe(5);
      expect(res.body.comment).toBe("Très bon suivi");
    });

    it("200 — un second envoi met à jour l'avis existant (upsert)", async () => {
      await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({
          veterinarianClinicId: vetClinicId,
          rating: 3,
          comment: "Moyen",
        });

      const res = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({
          veterinarianClinicId: vetClinicId,
          rating: 4,
          comment: "Finalement bien",
        });

      expect(res.status).toBe(200);
      expect(res.body.rating).toBe(4);
      expect(res.body.comment).toBe("Finalement bien");

      const prisma = getPrisma();
      const reviews = await prisma.review.findMany({
        where: { veterinarianClinicId: vetClinicId },
      });
      const clientReviews = reviews.filter(
        (r) => r.rating === 4 && r.comment === "Finalement bien",
      );
      expect(clientReviews).toHaveLength(1);
    });

    it("400 — rating invalide", async () => {
      const res = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ veterinarianClinicId: vetClinicId, rating: 10 });

      expect(res.status).toBe(400);
    });

    it("401 — sans token", async () => {
      const res = await request(app)
        .post("/api/reviews")
        .send({ veterinarianClinicId: vetClinicId, rating: 5 });

      expect(res.status).toBe(401);
    });

    it("403 — un rôle autre que CLIENT ne peut pas créer d'avis", async () => {
      const vetToken = await loginAs("veto@gmail.com");
      const res = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({ veterinarianClinicId: vetClinicId, rating: 5 });

      expect(res.status).toBe(403);
    });
  });

  // ── GET / ─────────────────────────────────────────────────────────────────

  describe("GET /api/reviews", () => {
    it("200 — CLIENT reçoit la liste de ses avis", async () => {
      const res = await request(app)
        .get("/api/reviews")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("200 — ADMIN reçoit tous les avis", async () => {
      const adminToken = await loginAs("admin@gmail.com");
      const res = await request(app)
        .get("/api/reviews")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("401 — sans token", async () => {
      const res = await request(app).get("/api/reviews");
      expect(res.status).toBe(401);
    });
  });

  // ── GET /stats ────────────────────────────────────────────────────────────

  describe("GET /api/reviews/stats", () => {
    it("200 — CLIENT reçoit ses propres stats", async () => {
      const res = await request(app)
        .get("/api/reviews/stats")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("average");
      expect(res.body).toHaveProperty("count");
    });

    it("200 — ADMIN reçoit les stats globales", async () => {
      const adminToken = await loginAs("admin@gmail.com");
      const res = await request(app)
        .get("/api/reviews/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("average");
      expect(res.body).toHaveProperty("count");
    });

    it("401 — sans token", async () => {
      const res = await request(app).get("/api/reviews/stats");
      expect(res.status).toBe(401);
    });
  });
});
