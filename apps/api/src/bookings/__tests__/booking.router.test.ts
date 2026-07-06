import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "crypto";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
// Ajuste selon l'emplacement réel de ce fichier de test
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

// ── GET /api/booking/clinics ─────────────────────────────────────────────────

describe("GET /api/booking/clinics", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/booking/clinics");
    expect(res.status).toBe(401);
  });

  it("403 — rôle non-CLIENT", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .get("/api/booking/clinics")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("200 — CLIENT recherche des cliniques sans filtre", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get("/api/booking/clinics")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("200 — CLIENT recherche avec géolocalisation et rayon", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get("/api/booking/clinics")
      .query({ lat: 48.8566, lng: 2.3522, radiusKm: 50 })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("400 — lat non numérique (échec de z.coerce.number())", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get("/api/booking/clinics")
      .query({ lat: "abc" })
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(422);
  });
});

// ── GET /api/booking/clinics/:clinicId/vets ──────────────────────────────────

describe("GET /api/booking/clinics/:clinicId/vets", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get(
      `/api/booking/clinics/${randomUUID()}/vets`,
    );
    expect(res.status).toBe(401);
  });

  it("403 — rôle non-CLIENT", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .get(`/api/booking/clinics/${randomUUID()}/vets`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("200 — retourne les vétérinaires disponibles d'une clinique existante", async () => {
    const vetClinic = await getVetWithClinic();
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get(`/api/booking/clinics/${vetClinic!.clinicId}/vets`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("200 — tableau vide pour une clinique inexistante (pas de 404)", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get(`/api/booking/clinics/${randomUUID()}/vets`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ── POST /api/booking ─────────────────────────────────────────────────────────

describe("POST /api/booking", () => {
  const meetingIds: string[] = [];
  afterAll(async () => {
    if (meetingIds.length > 0)
      await getPrisma().meetingBase.deleteMany({
        where: { id: { in: meetingIds } },
      });
  });
  it("401 — sans token", async () => {
    const res = await request(app).post("/api/booking").send({});
    expect(res.status).toBe(401);
  });

  it("403 — rôle non-CLIENT", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .post("/api/booking")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("400 — body invalide (champs manquants)", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .post("/api/booking")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("400 — animal n'appartenant pas au client", async () => {
    const vetClinic = await getVetWithClinic();
    // Animal d'un autre client (n'importe quel animal non lié à client@gmail.com)
    const otherAnimal = await getPrisma().animal.findFirst({
      where: {
        client: { user: { email: { not: "client@gmail.com" } } },
      },
    });

    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .post("/api/booking")
      .set("Authorization", `Bearer ${token}`)
      .send({
        animalId: otherAnimal!.id,
        veterinarianId: vetClinic!.veterinarianId,
        date: "2027-03-01",
        startTime: "2027-03-01T09:00:00.000Z",
        endTime: "2027-03-01T09:30:00.000Z",
      });

    expect(res.status).toBe(400);
  });

  it("201 — crée le rendez-vous avec des données valides", async () => {
    const animal = await getClientAnimal();
    const vetClinic = await getVetWithClinic();

    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .post("/api/booking")
      .set("Authorization", `Bearer ${token}`)
      .send({
        animalId: animal!.id,
        veterinarianId: vetClinic!.veterinarianId,
        date: "2027-08-30",
        startTime: "2027-03-02T11:45:00.000Z",
        endTime: "2027-03-02T11:46:00.000Z",
        description: "Consultation de routine",
      });
    meetingIds.push(res.body.meetingId);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("meetingId");
    expect(res.body.animal.id).toBe(animal!.id);
  });

  it("400 — créneau déjà réservé (conflit)", async () => {
    const animal = await getClientAnimal();
    const vetClinic = await getVetWithClinic();
    const payload = {
      animalId: animal!.id,
      veterinarianId: vetClinic!.veterinarianId,
      date: "2027-08-30",
      startTime: "2027-03-02T11:47:00.000Z",
      endTime: "2027-03-02T11:48:00.000Z",
    };

    const token = await loginAs("client@gmail.com");

    const first = await request(app)
      .post("/api/booking")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);
    expect(first.status).toBe(201);
    meetingIds.push(first.body.meetingId);

    const second = await request(app)
      .post("/api/booking")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(second.status).toBe(400);
  });
});
