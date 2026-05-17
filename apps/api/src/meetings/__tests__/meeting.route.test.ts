import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { getPrisma } from "../../../__tests__/setup";

const validQuery = "startDate=2026-01-01&endDate=2026-12-31";

const loginAs = async (email: string, password = "Password123!") => {
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

// ── GET /api/meetings/:id ─────────────────────────────────────────────────────

describe("GET /api/meetings/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/meetings/some-id");
    expect(res.status).toBe(401);
  });

  it("403 — rôle DIRECTOR non autorisé", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .get("/api/meetings/some-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("404 — meeting introuvable", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .get("/api/meetings/non-existent-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("200 — retourne le meeting", async () => {
    const token = await loginAs("veto@gmail.com");
    const meeting = await getPrisma().meetingBase.findFirst();

    const res = await request(app)
      .get(`/api/meetings/${meeting!.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", meeting!.id);
  });
});

// ── POST /api/meetings/availabilities ─────────────────────────────────────────

describe("POST /api/meetings/availabilities", () => {
  it("401 — sans token", async () => {
    const res = await request(app).post("/api/meetings/availabilities");
    expect(res.status).toBe(401);
  });

  it("403 — rôle CLIENT non autorisé", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .post("/api/meetings/availabilities")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("400 — body invalide", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .post("/api/meetings/availabilities")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });
  it("400 — heure de fin avant heure de début", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .post("/api/meetings/availabilities")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-06-01",
        startTime: "1970-01-01T09:00:00.000Z",
        endTime: "1970-01-01T08:00:00.000Z",
      });
    expect(res.status).toBe(400);
  });
  it("201 — VETERINARIAN crée une disponibilité", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .post("/api/meetings/availabilities")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-06-01",
        startTime: "1970-01-01T09:00:00.000Z",
        endTime: "1970-01-01T10:00:00.000Z",
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });
  it("201 — SECRETARY crée une disponibilité", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const res = await request(app)
      .post("/api/meetings/availabilities")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-06-01",
        startTime: "1970-01-01T09:00:00.000Z",
        endTime: "1970-01-01T10:00:00.000Z",
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });
});

// ── PATCH /api/meetings/availabilities/:id ────────────────────────────────────

describe("PATCH /api/meetings/availabilities/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).patch(
      "/api/meetings/availabilities/some-id",
    );
    expect(res.status).toBe(401);
  });

  it("403 — rôle CLIENT non autorisé", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .patch("/api/meetings/availabilities/some-id")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("200 — VETERINARIAN met à jour une disponibilité", async () => {
    const token = await loginAs("veto@gmail.com");
    const resAvailability = await request(app)
      .post("/api/meetings/availabilities")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-06-01",
        startTime: "1970-01-01T09:00:00.000Z",
        endTime: "1970-01-01T10:00:00.000Z",
      });
    const res = await request(app)
      .patch(`/api/meetings/availabilities/${resAvailability!.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        startTime: "1970-01-01T10:00:00.000Z",
        endTime: "1970-01-01T11:00:00.000Z",
      });
    expect(res.status).toBe(200);
  });
});

// ── DELETE /api/meetings/availabilities/:id ───────────────────────────────────

describe("DELETE /api/meetings/availabilities/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).delete(
      "/api/meetings/availabilities/some-id",
    );
    expect(res.status).toBe(401);
  });
  it("404 — n'existe pas", async () => {
    const token = await loginAs("veto@gmail.com");

    const res = await request(app)
      .delete(`/api/meetings/availabilities/notfound`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
  it("204 — VETERINARIAN supprime une disponibilité", async () => {
    const token = await loginAs("veto@gmail.com");

    // Crée une dispo à supprimer pour ne pas altérer les autres tests
    const created = await request(app)
      .post("/api/meetings/availabilities")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-07-01",
        startTime: "1970-01-01T09:00:00.000Z",
        endTime: "1970-01-01T10:00:00.000Z",
      });
    const res = await request(app)
      .delete(`/api/meetings/availabilities/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});

// ── POST /api/meetings/internal ───────────────────────────────────────────────

describe("POST /api/meetings/internal", () => {
  it("401 — sans token", async () => {
    const res = await request(app).post("/api/meetings/internal");
    expect(res.status).toBe(401);
  });

  it("403 — rôle CLIENT non autorisé", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .post("/api/meetings/internal")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("400 — body invalide", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .post("/api/meetings/internal")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("201 — SECRETARY crée une réunion interne", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const veto = await getPrisma().user.findUnique({
      where: { email: "veto@gmail.com" },
    });

    const res = await request(app)
      .post("/api/meetings/internal")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-06-15",
        startTime: "1970-01-01T14:00:00.000Z",
        endTime: "1970-01-01T15:00:00.000Z",
        title: "Réunion test",
        participantIds: [veto!.id],
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });
});

// ── DELETE /api/meetings/internal/:id ─────────────────────────────────────────

describe("DELETE /api/meetings/internal/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).delete("/api/meetings/internal/some-id");
    expect(res.status).toBe(401);
  });
  it("403 — N'est pas l'admin", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const veto = await getPrisma().user.findUnique({
      where: { email: "veto@gmail.com" },
    });

    const created = await request(app)
      .post("/api/meetings/internal")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-08-01",
        startTime: "1970-01-01T10:00:00.000Z",
        endTime: "1970-01-01T11:00:00.000Z",
        title: "À supprimer",
        participantIds: [veto!.id],
      });

    const tokenVeto = await loginAs("veto@gmail.com");
    const res = await request(app)
      .delete(`/api/meetings/internal/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenVeto}`);

    expect(res.status).toBe(403);
  });
  it("204 — SECRETARY supprime une réunion interne", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const veto = await getPrisma().user.findUnique({
      where: { email: "veto@gmail.com" },
    });

    const created = await request(app)
      .post("/api/meetings/internal")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-08-01",
        startTime: "1970-01-01T10:00:00.000Z",
        endTime: "1970-01-01T11:00:00.000Z",
        title: "À supprimer",
        participantIds: [veto!.id],
      });

    const res = await request(app)
      .delete(`/api/meetings/internal/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});

// ── POST /api/meetings/animal ─────────────────────────────────────────────────

describe("POST /api/meetings/animal", () => {
  it("401 — sans token", async () => {
    const res = await request(app).post("/api/meetings/animal");
    expect(res.status).toBe(401);
  });

  it("403 — rôle DIRECTOR non autorisé", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .post("/api/meetings/animal")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("400 — body invalide", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .post("/api/meetings/animal")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("201 — SECRETARY crée un rendez-vous animal", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const vetoProfile = await getPrisma().veterinarianProfile.findFirst();
    const ownedPet = await getPrisma().ownedPet.findFirst();
    const speciality = await getPrisma().speciality.findFirst();
    const vetoClinic = await getPrisma().veterinarianClinic.findFirst();

    const res = await request(app)
      .post("/api/meetings/animal")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-09-01",
        startTime: "1970-01-01T09:00:00.000Z",
        endTime: "1970-01-01T09:30:00.000Z",
        ownedPetId: ownedPet!.id,
        veterinarianClinicId: vetoClinic!.id,
        specialityId: speciality!.id,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });
});

// ── GET /api/meetings/animal/:id ──────────────────────────────────────────────

describe("GET /api/meetings/animal/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/meetings/animal/some-id");
    expect(res.status).toBe(401);
  });

  it("404 — rendez-vous introuvable", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .get("/api/meetings/animal/non-existent-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("200 — retourne le rendez-vous animal", async () => {
    const token = await loginAs("veto@gmail.com");
    const animalMeeting = await getPrisma().animalMeeting.findFirst();
    const res = await request(app)
      .get(`/api/meetings/animal/${animalMeeting!.meetingId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", animalMeeting!.id);
  });
});

// ── PATCH /api/meetings/animal/:id ────────────────────────────────────────────

describe("PATCH /api/meetings/animal/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).patch("/api/meetings/animal/some-id");
    expect(res.status).toBe(401);
  });

  it("403 — rôle SECRETARY non autorisé", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const res = await request(app)
      .patch("/api/meetings/animal/some-id")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("200 — VETERINARIAN met à jour un rendez-vous", async () => {
    const token = await loginAs("veto@gmail.com");
    const ownedPet = await getPrisma().ownedPet.findFirst();
    const speciality = await getPrisma().speciality.findFirst();
    const vetoClinic = await getPrisma().veterinarianClinic.findFirst();
    const resCreate = await request(app)
      .post("/api/meetings/animal")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-09-01",
        startTime: "1970-01-01T09:00:00.000Z",
        endTime: "1970-01-01T09:30:00.000Z",
        ownedPetId: ownedPet!.id,
        veterinarianClinicId: vetoClinic!.id,
        specialityId: speciality!.id,
      });
    const res = await request(app)
      .patch(`/api/meetings/animal/${resCreate.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ report: "Mise à jour du rapport" });
    expect(res.status).toBe(200);
  });
});

// ── DELETE /api/meetings/animal/:id ───────────────────────────────────────────

describe("DELETE /api/meetings/animal/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).delete("/api/meetings/animal/some-id");
    expect(res.status).toBe(401);
  });

  it("403 — rôle DIRECTOR non autorisé", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .delete("/api/meetings/animal/some-id")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("204 — VETERINARIAN supprime un rendez-vous animal", async () => {
    const token = await loginAs("veto@gmail.com");
    const vetoProfile = await getPrisma().veterinarianProfile.findFirst();
    const ownedPet = await getPrisma().ownedPet.findFirst();
    const vetoClinic = await getPrisma().veterinarianClinic.findFirst();
    const speciality = await getPrisma().speciality.findFirst();

    // Crée un RDV à supprimer
    const created = await request(app)
      .post("/api/meetings/animal")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-10-01",
        startTime: "1970-01-01T09:00:00.000Z",
        endTime: "1970-01-01T09:30:00.000Z",
        ownedPetId: ownedPet!.id,
        veterinarianClinicId: vetoClinic!.id,
        specialityId: speciality!.id,
      });

    const res = await request(app)
      .delete(`/api/meetings/animal/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});
