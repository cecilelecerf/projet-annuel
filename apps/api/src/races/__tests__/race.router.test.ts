import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";

import { app } from "@api/app";
import { getPrisma } from "../../../__tests__/setup";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";

const prisma = getPrisma();

async function createDisposablePet() {
  return prisma.pet.create({ data: { name: `Pet-${Date.now()}` } });
}

export async function createDisposableRace(petId: string) {
  return prisma.race.create({
    data: { name: `Race-${Date.now()}`, petId },
  });
}

async function createDisposableAnimalWithRace(raceId: string) {
  const client = await prisma.user.findUniqueOrThrow({
    where: { email: "client@gmail.com" },
    include: { clientProfile: true },
  });
  return prisma.animal.create({
    data: {
      name: `Animal-${Date.now()}`,
      dateOfBirth: new Date("2022-01-01"),
      clientId: client.clientProfile!.id,
      raceId,
    },
  });
}

describe("raceRouter", () => {
  let adminToken: string;
  let vetoToken: string;
  let clientToken: string;

  beforeAll(async () => {
    adminToken = await loginAs("admin@gmail.com");
    vetoToken = await loginAs("veto@gmail.com");
    clientToken = await loginAs("client@gmail.com");
  });

  // ── GET /api/races/:id ────────────────────────────────────────────────────────

  describe("GET /api/races/:id", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).get("/api/races/some-id");
      expect(res.status).toBe(401);
    });

    it("404 si la race n'existe pas", async () => {
      const res = await request(app)
        .get("/api/races/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(404);
    });

    it("200 — accessible à tout rôle authentifié", async () => {
      const pet = await createDisposablePet();
      const race = await createDisposableRace(pet.id);

      const res = await request(app)
        .get(`/api/races/${race.id}`)
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: race.id });
    });
  });

  // ── POST /races ───────────────────────────────────────────────────────────

  describe("POST /races", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).post("/api/races").send({});
      expect(res.status).toBe(401);
    });

    it("403 pour un rôle non ADMIN", async () => {
      const pet = await createDisposablePet();
      const res = await request(app)
        .post("/api/races")
        .set("Authorization", `Bearer ${vetoToken}`)
        .send({ name: "Test", petId: pet.id });
      expect(res.status).toBe(403);
    });

    it("400 si le body ne respecte pas createRaceSchema", async () => {
      const res = await request(app)
        .post("/api/races")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Test" }); // petId manquant
      expect(res.status).toBe(400);
    });

    it("404 — espèce inexistante", async () => {
      const res = await request(app)
        .post("/api/races")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Test",
          petId: "00000000-0000-0000-0000-000000000000",
        });
      expect(res.status).toBe(404);
    });

    it("201 — crée la race avec succès", async () => {
      const pet = await createDisposablePet();

      const res = await request(app)
        .post("/api/races")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: `Race-${Date.now()}`, petId: pet.id });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ petId: pet.id });
    });
  });

  // ── PATCH /api/races/:id ──────────────────────────────────────────────────────

  describe("PATCH /api/races/:id", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).patch("/api/races/some-id").send({});
      expect(res.status).toBe(401);
    });

    it("403 pour un rôle non ADMIN", async () => {
      const res = await request(app)
        .patch("/api/races/some-id")
        .set("Authorization", `Bearer ${vetoToken}`)
        .send({ name: "Nouveau" });
      expect(res.status).toBe(403);
    });

    it("404 si la race n'existe pas", async () => {
      const res = await request(app)
        .patch("/api/races/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Nouveau" });
      expect(res.status).toBe(404);
    });

    it("200 — met à jour la race avec succès", async () => {
      const pet = await createDisposablePet();
      const race = await createDisposableRace(pet.id);

      const res = await request(app)
        .patch(`/api/races/${race.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Nom modifié" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Nom modifié");
    });
  });

  // ── DELETE /api/races/:id ─────────────────────────────────────────────────────

  describe("DELETE /api/races/:id", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).delete("/api/races/some-id");
      expect(res.status).toBe(401);
    });

    it("403 pour un rôle non ADMIN", async () => {
      const res = await request(app)
        .delete("/api/races/some-id")
        .set("Authorization", `Bearer ${vetoToken}`);
      expect(res.status).toBe(403);
    });

    it("404 si la race n'existe pas", async () => {
      const res = await request(app)
        .delete("/api/races/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("400 — race référencée par un animal, suppression refusée", async () => {
      const pet = await createDisposablePet();
      const race = await createDisposableRace(pet.id);
      await createDisposableAnimalWithRace(race.id);

      const res = await request(app)
        .delete(`/api/races/${race.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it("204 — supprime la race non référencée", async () => {
      const pet = await createDisposablePet();
      const race = await createDisposableRace(pet.id);

      const res = await request(app)
        .delete(`/api/races/${race.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);

      const stillExists = await prisma.race.findUnique({
        where: { id: race.id },
      });
      expect(stillExists).toBeNull();
    });
  });
});
