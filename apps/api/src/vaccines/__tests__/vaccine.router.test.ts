import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";

import { app } from "@api/app";
import { getPrisma } from "../../../__tests__/setup";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";

const prisma = getPrisma();

async function createDisposablePet() {
  return prisma.pet.create({
    data: { name: `Pet-${Date.now()}` },
  });
}

async function createDisposableVaccine(petId: string) {
  return prisma.act.create({
    data: {
      name: `Vaccin-${Date.now()}`,
      type: "VACCINATION",
      basePrice: 30,
      vaccine: {
        create: {
          recommendedAge: 8,
          boosterInterval: 52,
          petId,
          countryRules: {
            create: [{ country: "FR", minAge: 8, type: "MANDATORY" }],
          },
        },
      },
    },
    include: { vaccine: true },
  });
}

describe("vaccineRouter", () => {
  let adminToken: string;
  let vetoToken: string;
  let clientToken: string;

  beforeAll(async () => {
    adminToken = await loginAs("admin@gmail.com");
    vetoToken = await loginAs("veto@gmail.com");
    clientToken = await loginAs("client@gmail.com");
  });

  // ── GET / ─────────────────────────────────────────────────────────────────

  describe("GET /api/vaccines", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).get("/api/vaccines");
      expect(res.status).toBe(401);
    });

    it("403 pour un rôle non ADMIN", async () => {
      const res = await request(app)
        .get("/api/vaccines")
        .set("Authorization", `Bearer ${vetoToken}`);
      expect(res.status).toBe(403);
    });

    it("200 — liste les vaccins pour un ADMIN", async () => {
      const res = await request(app)
        .get("/api/vaccines")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── GET /:id ──────────────────────────────────────────────────────────────

  describe("GET /api/vaccines/:id", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).get("/api/vaccines/some-id");
      expect(res.status).toBe(401);
    });

    it("404 si le vaccin n'existe pas", async () => {
      const res = await request(app)
        .get("/api/vaccines/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(404);
    });

    it("200 — accessible à tout rôle authentifié", async () => {
      const pet = await createDisposablePet();
      const act = await createDisposableVaccine(pet.id);

      const res = await request(app)
        .get(`/api/vaccines/${act.vaccine!.id}`)
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: act.vaccine!.id });
    });
  });

  // ── POST / ────────────────────────────────────────────────────────────────

  describe("POST /api/vaccines", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).post("/api/vaccines").send({});
      expect(res.status).toBe(401);
    });

    it("403 pour un rôle non ADMIN", async () => {
      const pet = await createDisposablePet();
      const res = await request(app)
        .post("/api/vaccines")
        .set("Authorization", `Bearer ${vetoToken}`)
        .send({
          name: "Test",
          basePrice: 30,
          recommendedAge: 8,
          boosterInterval: 52,
          petId: pet.id,
          countryRules: [{ country: "FR", minAge: 8, type: "MANDATORY" }],
        });
      expect(res.status).toBe(403);
    });

    it("400 si le body ne respecte pas createVaccineSchema", async () => {
      const res = await request(app)
        .post("/api/vaccines")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Test" }); // champs obligatoires manquants
      expect(res.status).toBe(400);
    });

    it("404 — espèce inexistante (erreur remontée depuis le service)", async () => {
      const res = await request(app)
        .post("/api/vaccines")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Test",
          basePrice: 30,
          recommendedAge: 8,
          boosterInterval: 52,
          petId: "00000000-0000-0000-0000-000000000000",
          countryRules: [{ country: "FR", minAge: 8, type: "MANDATORY" }],
        });
      expect(res.status).toBe(404);
    });

    it("201 — crée le vaccin avec succès", async () => {
      const pet = await createDisposablePet();

      const res = await request(app)
        .post("/api/vaccines")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: `Vaccin-${Date.now()}`,
          basePrice: 30,
          recommendedAge: 8,
          boosterInterval: 52,
          petId: pet.id,
          countryRules: [{ country: "FR", minAge: 8, type: "MANDATORY" }],
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ petId: pet.id, recommendedAge: 8 });
      expect(res.body.act.basePrice).toBe(30);
    });
  });

  // ── PATCH /:id ────────────────────────────────────────────────────────────

  describe("PATCH /api/vaccines/:id", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).patch("/api/vaccines/some-id").send({});
      expect(res.status).toBe(401);
    });

    it("403 pour un rôle non ADMIN", async () => {
      const res = await request(app)
        .patch("/api/vaccines/some-id")
        .set("Authorization", `Bearer ${vetoToken}`)
        .send({ recommendedAge: 10 });
      expect(res.status).toBe(403);
    });

    it("404 si le vaccin n'existe pas", async () => {
      const res = await request(app)
        .patch("/api/vaccines/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ recommendedAge: 10 });
      expect(res.status).toBe(404);
    });

    it("200 — met à jour le vaccin avec succès", async () => {
      const pet = await createDisposablePet();
      const act = await createDisposableVaccine(pet.id);

      const res = await request(app)
        .patch(`/api/vaccines/${act.vaccine!.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ recommendedAge: 12 });

      expect(res.status).toBe(200);
      expect(res.body.recommendedAge).toBe(12);
    });
  });

  // ── DELETE /:id ───────────────────────────────────────────────────────────

  describe("DELETE /api/vaccines/:id", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).delete("/api/vaccines/some-id");
      expect(res.status).toBe(401);
    });

    it("403 pour un rôle non ADMIN", async () => {
      const res = await request(app)
        .delete("/api/vaccines/some-id")
        .set("Authorization", `Bearer ${vetoToken}`);
      expect(res.status).toBe(403);
    });

    it("404 si le vaccin n'existe pas", async () => {
      const res = await request(app)
        .delete("/api/vaccines/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("204 — supprime le vaccin avec succès", async () => {
      const pet = await createDisposablePet();
      const act = await createDisposableVaccine(pet.id);

      const res = await request(app)
        .delete(`/api/vaccines/${act.vaccine!.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);

      const stillExists = await prisma.vaccine.findUnique({
        where: { id: act.vaccine!.id },
      });
      expect(stillExists).toBeNull();
    });
  });
});
