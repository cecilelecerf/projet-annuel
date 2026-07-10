import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
import { getPrisma } from "../../../__tests__/setup";

describe("Client Shop router", () => {
  let clientToken: string;
  let referentToken: string;
  let animalId: string;

  beforeAll(async () => {
    clientToken = await loginAs("client@gmail.com");
    referentToken = await loginAs("referent@gmail.com");

    const prisma = getPrisma();
    const clientUser = await prisma.user.findUnique({
      where: { email: "client@gmail.com" },
    });
    if (!clientUser) throw new Error("client@gmail.com introuvable");
    const animal = await prisma.animal.findFirst({
      where: { clientId: clientUser.id },
    });
    if (!animal) throw new Error("Aucun animal seedé pour client@gmail.com");
    animalId = animal.id;
  });

  describe("GET /api/shop", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/shop");
      expect(res.status).toBe(401);
    });

    it("403 — REFERENT n'a pas accès à la boutique client", async () => {
      const res = await request(app)
        .get("/api/shop")
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(403);
    });

    it("200 — CLIENT reçoit les produits de ses cliniques", async () => {
      const res = await request(app)
        .get("/api/shop")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("GET /api/shop/animals", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/shop/animals");
      expect(res.status).toBe(401);
    });

    it("200 — CLIENT reçoit la liste de ses animaux", async () => {
      const res = await request(app)
        .get("/api/shop/animals")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((a: any) => a.id === animalId)).toBe(true);
    });
  });

  describe("GET /api/shop/recommendations/:animalId", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get(`/api/shop/recommendations/${animalId}`);
      expect(res.status).toBe(401);
    });

    it("404 — animal inexistant", async () => {
      const res = await request(app)
        .get("/api/shop/recommendations/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(404);
    });

    it("200 — CLIENT reçoit les recommandations pour son propre animal", async () => {
      const res = await request(app)
        .get(`/api/shop/recommendations/${animalId}`)
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty("clinicProductId");
        expect(res.body[0]).toHaveProperty("recommendation");
        expect(res.body[0]).toHaveProperty("matchedConditions");
        expect(res.body[0]).toHaveProperty("dailyGrams");
      }
    });
  });

  describe("GET /api/shop/:id", () => {
    it("404 — produit inexistant", async () => {
      const res = await request(app)
        .get("/api/shop/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(404);
    });
  });
});