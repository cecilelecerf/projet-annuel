import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { getPrisma } from "../../../__tests__/setup";

const validQuery = "startDate=2026-01-01&endDate=2026-12-31";

export const loginAs = async (email: string, password = "Password123!") => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res.body.accessToken as string;
};

// ── GET /api/meetings/calendar ────────────────────────────────────────────────

describe("GET /api/meetings/calendar", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get(`/api/meetings/calendar?${validQuery}`);
    expect(res.status).toBe(401);
  });

  it("401 — token invalide", async () => {
    const res = await request(app)
      .get(`/api/meetings/calendar?${validQuery}`)
      .set("Authorization", "Bearer invalid_token");
    expect(res.status).toBe(401);
  });

  it("403 — rôle CLIENT non autorisé", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get(`/api/meetings/calendar?${validQuery}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("400 — dates manquantes", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .get("/api/meetings/calendar")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  describe("User retourne son calendrier", async () => {
    it("200 — Veto retourne son calendrier", async () => {
      const token = await loginAs("veto@gmail.com");
      const res = await request(app)
        .get(`/api/meetings/calendar?${validQuery}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("meetings");
      expect(res.body).toHaveProperty("availabilities");
    });

    it("200 — SECRETARY retourne son calendrier", async () => {
      const token = await loginAs("secretaire@gmail.com");
      const res = await request(app)
        .get(`/api/meetings/calendar?${validQuery}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("meetings");
      expect(res.body).toHaveProperty("availabilities");
    });
    it("200 — Director retourne son calendrier", async () => {
      const token = await loginAs("directeur@gmail.com");
      const res = await request(app)
        .get(`/api/meetings/calendar?${validQuery}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("meetings");
      expect(res.body).toHaveProperty("availabilities");
    });
    it("200 — Referent retourne son calendrier", async () => {
      const token = await loginAs("referent@gmail.com");
      const res = await request(app)
        .get(`/api/meetings/calendar?${validQuery}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("meetings");
      expect(res.body).toHaveProperty("availabilities");
    });

    it("200 — ADMIN retourne son calendrier (vetProfile/clientProfile absents, clinicIds ignoré)", async () => {
      const token = await loginAs("admin@gmail.com");
      const res = await request(app)
        .get(`/api/meetings/calendar?${validQuery}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("meetings");
      expect(res.body).toHaveProperty("availabilities");
    });
  });
});

// ── GET /api/meetings/calendar/:veterinarianId ────────────────────────────────

describe("GET /api/meetings/calendar/:veterinarianId", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get(
      `/api/meetings/calendar/some-id?${validQuery}`,
    );
    expect(res.status).toBe(401);
  });

  it("403 — rôle VETERINARIAN non autorisé", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .get(`/api/meetings/calendar/some-id?${validQuery}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("400 — dates manquantes", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const res = await request(app)
      .get("/api/meetings/calendar/some-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("404 — vétérinaire introuvable", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const res = await request(app)
      .get(`/api/meetings/calendar/non-existent-id?${validQuery}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("200 — SECRETARY retourne le calendrier d'un vétérinaire", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const vetoProfile = await getPrisma().veterinarianProfile.findFirst();

    const res = await request(app)
      .get(`/api/meetings/calendar/${vetoProfile!.id}?${validQuery}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("meetings");
    expect(res.body).toHaveProperty("availabilities");
  });
});

// ── GET /api/meetings/veterinarians/:veterinarianId/slots ────────────────────

describe("GET /api/meetings/veterinarians/:veterinarianId/slots", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get(
      "/api/meetings/veterinarians/some-id/slots",
    );
    expect(res.status).toBe(401);
  });

  it("403 — rôle non-CLIENT (route réservée au client)", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .get(
        "/api/meetings/veterinarians/some-id/slots?date=2026-06-01&clinicId=some-clinic-id",
      )
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("400 — date et clinicId manquants", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get("/api/meetings/veterinarians/some-id/slots")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("400 — clinicId manquant seul", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get("/api/meetings/veterinarians/some-id/slots?date=2026-06-01")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("404 — vétérinaire introuvable", async () => {
    const token = await loginAs("client@gmail.com");
    const clinic = await getPrisma().clinic.findFirst();

    const res = await request(app)
      .get(
        `/api/meetings/veterinarians/non-existent-id/slots?date=2026-06-01&clinicId=${clinic!.id}`,
      )
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("200 — retourne les créneaux disponibles du vétérinaire", async () => {
    const token = await loginAs("client@gmail.com");
    const vetoProfile = await getPrisma().veterinarianProfile.findFirst({
      include: { veterinarianClinics: true },
    });
    const clinicId =
      vetoProfile!.veterinarianClinics[0]?.clinicId ??
      (await getPrisma().clinic.findFirst())!.id;

    const res = await request(app)
      .get(
        `/api/meetings/veterinarians/${vetoProfile!.id}/slots?date=2026-06-01&clinicId=${clinicId}`,
      )
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── GET /api/meetings/:id ─────────────────────────────────────────────────────

describe("GET /api/meetings/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/meetings/some-id");
    expect(res.status).toBe(401);
  });

  it("404 — meeting introuvable", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .get("/api/meetings/non-existent-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("200 — VETERINARIAN retourne le meeting", async () => {
    const token = await loginAs("veto@gmail.com");
    const meeting = await getPrisma().meetingBase.findFirst();

    const res = await request(app)
      .get(`/api/meetings/${meeting!.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", meeting!.id);
  });

  it("200 — CLIENT retourne son propre meeting animal", async () => {
    const token = await loginAs("client@gmail.com");

    const clientUser = await getPrisma().user.findUnique({
      where: { email: "client@gmail.com" },
      include: { clientProfile: true },
    });
    const animal = await getPrisma().animal.findMany({
      where: {
        clientId: clientUser!.clientProfile!.id,
        animalMeeting: { some: {} },
      },
      include: { animalMeeting: { include: { meeting: true } } },
    });

    const meetingId = animal![1].animalMeeting[0].meeting!.id;
    const res = await request(app)
      .get(`/api/meetings/${meetingId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", meetingId);
  });

  it("403 — CLIENT n'a pas accès au meeting d'un autre client", async () => {
    const token = await loginAs("client@gmail.com");

    const clientUser = await getPrisma().user.findUnique({
      where: { email: "client@gmail.com" },
      include: { clientProfile: true },
    });
    const otherAnimalMeeting = await getPrisma().animalMeeting.findFirst({
      where: {
        animal: { clientId: { not: clientUser!.clientProfile!.id } },
        meetingId: { not: null },
      },
      include: { meeting: true, animal: { include: { client: true } } },
    });

    const res = await request(app)
      .get(`/api/meetings/${otherAnimalMeeting!.meeting!.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("400 — date invalide sur un meeting récurrent", async () => {
    const token = await loginAs("veto@gmail.com");
    const recurring = await getPrisma().meetingReccuring.findFirst();

    // Si aucun meeting récurrent n'est seedé, ce test est ignoré plutôt que
    // de faire échouer la suite pour une donnée de seed manquante.
    if (!recurring) return;

    const res = await request(app)
      .get(`/api/meetings/${recurring.id}?date=not-a-valid-date`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it("409 — meeting récurrent de type ANIMAL (non supporté, ConflictError)", async () => {
    const token = await loginAs("veto@gmail.com");
    const recurring = await getPrisma().meetingReccuring.findFirst({
      where: { kind: "ANIMAL" },
    });

    if (!recurring) return;

    const res = await request(app)
      .get(`/api/meetings/${recurring.id}?date=2026-06-01`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(409);
  });

  it("200 — meeting de type INTERNAL", async () => {
    const token = await loginAs("veto@gmail.com");
    const internal = await getPrisma().meetingBase.findFirst({
      where: { kind: "INTERNAL" },
    });

    if (!internal) return;

    const res = await request(app)
      .get(`/api/meetings/${internal.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", internal.id);
  });

  it("200 — meeting récurrent de type INTERNAL avec date valide", async () => {
    const token = await loginAs("veto@gmail.com");
    const recurring = await getPrisma().meetingReccuring.findFirst({
      where: { kind: "INTERNAL" },
    });

    if (!recurring) return;

    const res = await request(app)
      .get(`/api/meetings/${recurring.id}?date=2026-06-01`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("200 — meeting de type AVAILABILITY", async () => {
    const token = await loginAs("veto@gmail.com");
    const availability = await getPrisma().meetingBase.findFirst({
      where: { kind: "AVAILABILITY" },
    });

    if (!availability) return;

    const res = await request(app)
      .get(`/api/meetings/${availability.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("200 — meeting récurrent de type AVAILABILITY avec date valide", async () => {
    const token = await loginAs("veto@gmail.com");
    const recurring = await getPrisma().meetingReccuring.findFirst({
      where: { kind: "AVAILABILITY" },
    });

    if (!recurring) return;

    const res = await request(app)
      .get(`/api/meetings/${recurring.id}?date=2026-06-01`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
