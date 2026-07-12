import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
import { getPrisma } from "../../../__tests__/setup";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getClientAnimal() {
  return getPrisma().animal.findFirst({
    where: { client: { user: { email: "client@gmail.com" } } },
  });
}

async function getVetWithClinic() {
  return getPrisma().veterinarianClinic.findFirst({
    where: { veterinarian: { user: { email: "veto@gmail.com" } } },
  });
}

async function createBooking({
  animalId,
  veterinarianId,
  date,
  startTime,
  endTime,
  token,
}: {
  animalId: string;
  veterinarianId: string;
  date: string;
  startTime: string;
  endTime: string;
  token: string;
}) {
  return request(app)
    .post("/api/booking")
    .set("Authorization", `Bearer ${token}`)
    .send({
      animalId,
      veterinarianId,
      date,
      startTime,
      endTime,
      description: "Consultation de routine",
    });
}

describe("Booking router", () => {
  let clientToken: string;
  let vetToken: string;

  let animalId: string;
  let veterinarianId: string;

  beforeAll(async () => {
    clientToken = await loginAs("client@gmail.com");
    vetToken = await loginAs("veto@gmail.com");

    const animal = await getClientAnimal();
    const vetClinic = await getVetWithClinic();

    if (!animal || !vetClinic) throw new Error("Fixtures introuvables");

    animalId = animal.id;
    veterinarianId = vetClinic.veterinarianId;
  });

  describe("GET /api/booking/clinics", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/booking/clinics");
      expect(res.status).toBe(401);
    });

    it("403 — rôle non-CLIENT", async () => {
      const res = await request(app)
        .get("/api/booking/clinics")
        .set("Authorization", `Bearer ${vetToken}`);
      expect(res.status).toBe(403);
    });

    it("200 — CLIENT recherche des cliniques sans filtre", async () => {
      const res = await request(app)
        .get("/api/booking/clinics")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("200 — CLIENT recherche avec géolocalisation et rayon", async () => {
      const res = await request(app)
        .get("/api/booking/clinics")
        .query({ lat: 48.8566, lng: 2.3522, radiusKm: 50 })
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("422 — lat non numérique (échec de z.coerce.number())", async () => {
      const res = await request(app)
        .get("/api/booking/clinics")
        .query({ lat: "abc" })
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(422);
    });
  });

  describe("GET /api/booking/clinics/:clinicId/vets", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get(
        "/api/booking/clinics/00000000-0000-0000-0000-000000000000/vets",
      );
      expect(res.status).toBe(401);
    });

    it("403 — rôle non-CLIENT", async () => {
      const res = await request(app)
        .get("/api/booking/clinics/00000000-0000-0000-0000-000000000000/vets")
        .set("Authorization", `Bearer ${vetToken}`);
      expect(res.status).toBe(403);
    });

    it("200 — retourne les vétérinaires disponibles d'une clinique existante", async () => {
      const vetClinic = await getVetWithClinic();
      const res = await request(app)
        .get(`/api/booking/clinics/${vetClinic!.clinicId}/vets`)
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("200 — tableau vide pour une clinique inexistante (pas de 404)", async () => {
      const res = await request(app)
        .get("/api/booking/clinics/00000000-0000-0000-0000-000000000000/vets")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("POST /api/booking", () => {
    beforeAll(async () => {
      await getPrisma().meetingBase.deleteMany({
        where: {
          date: {
            in: [
              new Date("2027-04-01"),
              new Date("2027-05-01"),
              new Date("2027-06-01"),
            ],
          },
        },
      });
    });
    it("401 — sans token", async () => {
      const res = await request(app).post("/api/booking").send({});
      expect(res.status).toBe(401);
    });

    it("403 — rôle non-CLIENT", async () => {
      const res = await request(app)
        .post("/api/booking")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it("400 — body invalide (champs manquants)", async () => {
      const res = await request(app)
        .post("/api/booking")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it("400 — animal n'appartenant pas au client", async () => {
      const otherAnimal = await getPrisma().animal.findFirst({
        where: {
          client: { user: { email: { not: "client@gmail.com" } } },
        },
      });

      const res = await createBooking({
        animalId: otherAnimal!.id,
        veterinarianId,
        date: "2027-04-01",
        startTime: "2027-04-01T09:00:00.000Z",
        endTime: "2027-04-01T09:30:00.000Z",
        token: clientToken,
      });

      expect(res.status).toBe(400);
    });

    it("201 — crée le rendez-vous avec des données valides", async () => {
      const res = await createBooking({
        animalId,
        veterinarianId,
        date: "2027-05-01",
        startTime: "2027-05-01T11:45:00.000Z",
        endTime: "2027-05-01T11:46:00.000Z",
        token: clientToken,
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("meetingId");
      expect(res.body.animal.id).toBe(animalId);
    });

    it("400 — créneau déjà réservé (conflit)", async () => {
      const payload = {
        animalId,
        veterinarianId,
        date: "2027-06-01",
        startTime: "2027-06-01T11:47:00.000Z",
        endTime: "2027-06-01T11:48:00.000Z",
        token: clientToken,
      };

      const first = await createBooking(payload);
      expect(first.status).toBe(201);

      const second = await createBooking(payload);
      expect(second.status).toBe(400);
    });
  });
});
