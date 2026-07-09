import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";

// ⚠️ Ajustez ces imports selon votre setup réel de tests d'intégration
import { app } from "@api/app";
import { getPrisma } from "../../../__tests__/setup";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
const prisma = getPrisma();

async function createDisposablePet() {
  return prisma.pet.create({
    data: { name: `Pet-${Date.now()}` },
  });
}

async function createDisposableVaccineForPet(petId: string) {
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
        },
      },
    },
    include: { vaccine: true },
  });
}

describe("petRouter", () => {
  let adminToken: string;
  let vetoToken: string;
  let clientToken: string;

  beforeAll(async () => {
    adminToken = await loginAs("admin@gmail.com");
    vetoToken = await loginAs("veto@gmail.com");
    clientToken = await loginAs("client@gmail.com");
  });

  // ── GET / ─────────────────────────────────────────────────────────────────

  describe("GET /pets", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).get("/api/pets");
      expect(res.status).toBe(401);
    });

    it("200 — accessible à tout rôle authentifié (pas de roleMiddleware)", async () => {
      const res = await request(app)
        .get("/api/pets")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── GET /:id ──────────────────────────────────────────────────────────────

  describe("GET /pets/:id", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).get("/api/pets/some-id");
      expect(res.status).toBe(401);
    });

    it("404 si l'espèce n'existe pas", async () => {
      const res = await request(app)
        .get("/api/pets/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(404);
    });

    it("200 — retourne l'espèce", async () => {
      const pet = await createDisposablePet();

      const res = await request(app)
        .get(`/api/pets/${pet.id}`)
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: pet.id, name: pet.name });
    });
  });

  // ── GET /:id/vaccines ─────────────────────────────────────────────────────

  describe("GET /pets/:id/vaccines", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).get("/api/pets/some-id/vaccines");
      expect(res.status).toBe(401);
    });

    it("404 si l'espèce n'existe pas", async () => {
      const res = await request(app)
        .get("/api/pets/00000000-0000-0000-0000-000000000000/vaccines")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(404);
    });

    it("200 — liste les vaccins de l'espèce", async () => {
      const pet = await createDisposablePet();

      const res = await request(app)
        .get(`/api/pets/${pet.id}/vaccines`)
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // ── POST / ────────────────────────────────────────────────────────────────

  describe("POST /pets", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).post("/api/pets").send({});
      expect(res.status).toBe(401);
    });

    it("403 pour un rôle non ADMIN", async () => {
      const res = await request(app)
        .post("/api/pets")
        .set("Authorization", `Bearer ${vetoToken}`)
        .send({ name: "Test" });
      expect(res.status).toBe(403);
    });

    it("400 si le body ne respecte pas createPetSchema", async () => {
      const res = await request(app)
        .post("/api/pets")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({}); // name manquant
      expect(res.status).toBe(400);
    });

    it("201 — crée l'espèce avec succès", async () => {
      const res = await request(app)
        .post("/api/pets")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: `Espece-${Date.now()}` });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });
  });

  // ── PATCH /:id ────────────────────────────────────────────────────────────

  describe("PATCH /pets/:id", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).patch("/api/pets/some-id").send({});
      expect(res.status).toBe(401);
    });

    it("403 pour un rôle non ADMIN", async () => {
      const res = await request(app)
        .patch("/api/pets/some-id")
        .set("Authorization", `Bearer ${vetoToken}`)
        .send({ name: "Nouveau" });
      expect(res.status).toBe(403);
    });

    it("404 si l'espèce n'existe pas", async () => {
      const res = await request(app)
        .patch("/api/pets/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Nouveau" });
      expect(res.status).toBe(404);
    });

    it("200 — met à jour l'espèce avec succès", async () => {
      const pet = await createDisposablePet();

      const res = await request(app)
        .patch(`/api/pets/${pet.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Nom modifié" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Nom modifié");
    });
  });

  // ── DELETE /:id ───────────────────────────────────────────────────────────

  describe("DELETE /pets/:id", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).delete("/api/pets/some-id");
      expect(res.status).toBe(401);
    });

    it("403 pour un rôle non ADMIN", async () => {
      const res = await request(app)
        .delete("/api/pets/some-id")
        .set("Authorization", `Bearer ${vetoToken}`);
      expect(res.status).toBe(403);
    });

    it("404 si l'espèce n'existe pas", async () => {
      const res = await request(app)
        .delete("/api/pets/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("400 — espèce référencée par un vaccin, suppression refusée", async () => {
      const pet = await createDisposablePet();
      await createDisposableVaccineForPet(pet.id);

      const res = await request(app)
        .delete(`/api/pets/${pet.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it("204 — supprime l'espèce non référencée", async () => {
      const pet = await createDisposablePet();

      const res = await request(app)
        .delete(`/api/pets/${pet.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);

      const stillExists = await prisma.pet.findUnique({
        where: { id: pet.id },
      });
      expect(stillExists).toBeNull();
    });
  });
});
