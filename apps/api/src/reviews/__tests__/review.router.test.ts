import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
import { getPrisma } from "../../../__tests__/setup";

describe("Review router", () => {
  let clientToken: string;
  let vetId: string;

  beforeAll(async () => {
    clientToken = await loginAs("client@gmail.com");

    const prisma = getPrisma();
    const vet = await prisma.veterinarianProfile.findFirst();
    if (!vet) throw new Error("Aucun véto seedé pour les tests");
    vetId = vet.id;
  });

  // ── GET /vets ─────────────────────────────────────────────────────────────

  describe("GET /api/reviews/vets", () => {
    it("200 — CLIENT reçoit la liste des vétérinaires avec leurs notes", async () => {
      const res = await request(app)
        .get("/api/reviews/vets")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty("averageRating");
        expect(res.body[0]).toHaveProperty("reviewCount");
        expect(res.body[0]).toHaveProperty("clinics");
      }
    });

    it("401 — sans token", async () => {
      const res = await request(app).get("/api/reviews/vets");
      expect(res.status).toBe(401);
    });

    it("403 — un rôle autre que CLIENT ne peut pas accéder", async () => {
      const vetToken = await loginAs("veto@gmail.com");
      const res = await request(app)
        .get("/api/reviews/vets")
        .set("Authorization", `Bearer ${vetToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ── POST / ────────────────────────────────────────────────────────────────

  describe("POST /api/reviews", () => {
    it("200 — CLIENT crée un avis", async () => {
      const res = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({
          veterinarianId: vetId,
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
        .send({ veterinarianId: vetId, rating: 3, comment: "Moyen" });

      const res = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ veterinarianId: vetId, rating: 4, comment: "Finalement bien" });

      expect(res.status).toBe(200);
      expect(res.body.rating).toBe(4);
      expect(res.body.comment).toBe("Finalement bien");

      const prisma = getPrisma();
      const reviews = await prisma.vetReview.findMany({
        where: { veterinarianId: vetId },
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
        .send({ veterinarianId: vetId, rating: 10 });

      expect(res.status).toBe(400);
    });

    it("403 — un rôle autre que CLIENT ne peut pas créer d'avis", async () => {
      const vetToken = await loginAs("veto@gmail.com");
      const res = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({ veterinarianId: vetId, rating: 5 });

      expect(res.status).toBe(403);
    });
  });

  // ── GET /mine ─────────────────────────────────────────────────────────────

  describe("GET /api/reviews/mine", () => {
    it("200 — CLIENT reçoit ses propres avis", async () => {
      await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ veterinarianId: vetId, rating: 5, comment: "Top" });

      const res = await request(app)
        .get("/api/reviews/mine")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((r: any) => r.veterinarianId === vetId)).toBe(true);
    });

    it("401 — sans token", async () => {
      const res = await request(app).get("/api/reviews/mine");
      expect(res.status).toBe(401);
    });
  });
});
