import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { getPrisma } from "../../../__tests__/setup";

const validQuery = "startDate=2026-01-01&endDate=2026-12-31";

describe("Vetrinarian router", () => {
  // ── GET /:id/calendar ──────────────────────────────────────────────────────
  describe("GET /api/veterinarians/:veterinarianId/calendar", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get(
        `/api/veterinarians/some-id?/calendar?${validQuery}`,
      );
      expect(res.status).toBe(401);
    });

    it("403 — rôle VETERINARIAN non autorisé", async () => {
      const token = await loginAs("veto@gmail.com");
      const res = await request(app)
        .get(`/api/veterinarians/some-id/calendar?${validQuery}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it("400 — dates manquantes", async () => {
      const token = await loginAs("secretaire@gmail.com");
      const res = await request(app)
        .get("/api/veterinarians/some-id/calendar")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it("404 — vétérinaire introuvable", async () => {
      const token = await loginAs("secretaire@gmail.com");
      const res = await request(app)
        .get(`/api/veterinarians/non-existent-id/calendar?${validQuery}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it("200 — SECRETARY retourne le calendrier d'un vétérinaire", async () => {
      const token = await loginAs("secretaire@gmail.com");
      const vetoProfile = await getPrisma().veterinarianProfile.findFirst({
        where: {
          veterinarianClinics: {
            some: {},
          },
        },
      });

      const res = await request(app)
        .get(`/api/veterinarians/${vetoProfile!.id}/calendar?${validQuery}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("meetings");
      expect(res.body).toHaveProperty("availabilities");
    });
  });

  // ── GET /:id/meetings/slots ───────────────────────────────────────────────
  describe("GET /api/veterinarians/:veterinarianId/meetings/slots", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get(
        "/api/veterinarians/some-id/meetings/slots",
      );
      expect(res.status).toBe(401);
    });

    it("403 — rôle non-CLIENT (route réservée au client)", async () => {
      const token = await loginAs("veto@gmail.com");
      const res = await request(app)
        .get(
          "/api/veterinarians/some-id/meetings/slots?date=2026-06-01&clinicId=some-clinic-id",
        )
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it("400 — date et clinicId manquants", async () => {
      const token = await loginAs("client@gmail.com");
      const res = await request(app)
        .get("/api/veterinarians/some-id/meetings/slots")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it("400 — clinicId manquant seul", async () => {
      const token = await loginAs("client@gmail.com");
      const res = await request(app)
        .get("/api/veterinarians/some-id/meetings/slots?date=2026-06-01")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it("404 — vétérinaire introuvable", async () => {
      const token = await loginAs("client@gmail.com");
      const clinic = await getPrisma().clinic.findFirst();

      const res = await request(app)
        .get(
          `/api/veterinarians/non-existent-id/meetings/slots?date=2026-06-01&clinicId=${clinic!.id}`,
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
          `/api/veterinarians/${vetoProfile!.id}/meetings/slots?date=2026-06-01&clinicId=${clinicId}`,
        )
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── GET /:id/availabilities/timeline ─────────────────────────────────────
  describe("GET /api/veterinarians/:veterinarianId/availabilities/timeline", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get(
        "/api/veterinarians/some-id/availabilities/timeline?date=2026-06-01",
      );
      expect(res.status).toBe(401);
    });

    it("403 — rôle CLIENT non autorisé (route STAFF_ROLES)", async () => {
      const token = await loginAs("client@gmail.com");
      const res = await request(app)
        .get(
          "/api/veterinarians/some-id/availabilities/timeline?date=2026-06-01",
        )
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it("400 — date manquante", async () => {
      const token = await loginAs("secretaire@gmail.com");
      const res = await request(app)
        .get("/api/veterinarians/some-id/availabilities/timeline")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it("200 — staff retourne la timeline de disponibilité", async () => {
      const token = await loginAs("secretaire@gmail.com");
      const vetoProfile = await getPrisma().veterinarianProfile.findFirst({
        where: { veterinarianClinics: { some: {} } },
      });

      const res = await request(app)
        .get(
          `/api/veterinarians/${vetoProfile!.id}/availabilities/timeline?date=2026-06-01`,
        )
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("windows");
      expect(res.body).toHaveProperty("busy");
    });
  });

  // ── GET /:id/reviews/stats ────────────────────────────────────────────────
  describe("GET /api/veterinarians/:veterinarianId/reviews/stats", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get(
        "/api/veterinarians/some-id/reviews/stats",
      );
      expect(res.status).toBe(401);
    });

    it("403 — rôle CLIENT non autorisé (réservé REFERENT/DIRECTOR)", async () => {
      const token = await loginAs("client@gmail.com");
      const res = await request(app)
        .get("/api/veterinarians/some-id/reviews/stats")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it("200 — REFERENT retourne les stats d'avis d'un vétérinaire", async () => {
      const token = await loginAs("referent@gmail.com");
      const vetoProfile = await getPrisma().veterinarianProfile.findFirst({
        where: { veterinarianClinics: { some: {} } },
      });

      const res = await request(app)
        .get(`/api/veterinarians/${vetoProfile!.id}/reviews/stats`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("average");
      expect(res.body).toHaveProperty("count");
    });

    it("200 — DIRECTOR retourne les stats d'avis d'un vétérinaire", async () => {
      const token = await loginAs("directeur@gmail.com");
      const vetoProfile = await getPrisma().veterinarianProfile.findFirst({
        where: { veterinarianClinics: { some: {} } },
      });

      const res = await request(app)
        .get(`/api/veterinarians/${vetoProfile!.id}/reviews/stats`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  // ── GET /:id/animals ──────────────────────────────────────────────────────
  describe("GET /api/veterinarians/:veterinarianId/animals", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/veterinarians/some-id/animals");
      expect(res.status).toBe(401);
    });

    it("403 — rôle CLIENT non autorisé (réservé VETERINARIAN/SECRETARY)", async () => {
      const token = await loginAs("client@gmail.com");
      const res = await request(app)
        .get("/api/veterinarians/some-id/animals")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it("200 — VETERINARIAN retourne la liste paginée de ses animaux", async () => {
      const token = await loginAs("veto@gmail.com");
      const vetoProfile = await getPrisma().veterinarianProfile.findFirst({
        where: { veterinarianClinics: { some: {} } },
      });

      const res = await request(app)
        .get(`/api/veterinarians/${vetoProfile!.id}/animals`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("200 — SECRETARY retourne la liste paginée des animaux d'un vétérinaire", async () => {
      const token = await loginAs("secretaire@gmail.com");
      const vetoProfile = await getPrisma().veterinarianProfile.findFirst({
        where: { veterinarianClinics: { some: {} } },
      });

      const res = await request(app)
        .get(`/api/veterinarians/${vetoProfile!.id}/animals`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── GET /:id/specialities ─────────────────────────────────────────────────
  describe("GET /api/veterinarians/:veterinarianId/specialities", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get(
        "/api/veterinarians/some-id/specialities",
      );
      expect(res.status).toBe(401);
    });

    it("200 — n'importe quel rôle authentifié peut consulter les spécialités", async () => {
      const token = await loginAs("client@gmail.com");
      const vetoProfile = await getPrisma().veterinarianProfile.findFirst({
        where: { veterinarianClinics: { some: {} } },
      });

      const res = await request(app)
        .get(`/api/veterinarians/${vetoProfile!.id}/specialities`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── PATCH /:id/specialities ───────────────────────────────────────────────
  describe("PATCH /api/veterinarians/:veterinarianId/specialities", () => {
    it("401 — sans token", async () => {
      const res = await request(app)
        .patch("/api/veterinarians/some-id/specialities")
        .send({ specialityIds: [] });
      expect(res.status).toBe(401);
    });

    it("403 — rôle non-VETERINARIAN non autorisé", async () => {
      const token = await loginAs("secretaire@gmail.com");
      const res = await request(app)
        .patch("/api/veterinarians/some-id/specialities")
        .set("Authorization", `Bearer ${token}`)
        .send({ specialityIds: [] });
      expect(res.status).toBe(403);
    });

    it("400 — corps invalide (specialityIds manquant)", async () => {
      const token = await loginAs("veto@gmail.com");
      const vetoProfile = await getPrisma().veterinarianProfile.findFirst({
        where: { veterinarianClinics: { some: {} } },
      });

      const res = await request(app)
        .patch(`/api/veterinarians/${vetoProfile!.id}/specialities`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("200 — VETERINARIAN met à jour ses spécialités acceptées", async () => {
      const token = await loginAs("veto@gmail.com");
      const vetoProfile = await getPrisma().veterinarianProfile.findFirst({
        where: { veterinarianClinics: { some: {} } },
      });
      const speciality = await getPrisma().speciality.findFirst();

      const res = await request(app)
        .patch(`/api/veterinarians/${vetoProfile!.id}/specialities`)
        .set("Authorization", `Bearer ${token}`)
        .send({ specialityIds: speciality ? [speciality.id] : [] });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── GET /:id/pets ─────────────────────────────────────────────────────────
  describe("GET /api/veterinarians/:veterinarianId/pets", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/veterinarians/some-id/pets");
      expect(res.status).toBe(401);
    });

    it("200 — n'importe quel rôle authentifié peut consulter les espèces acceptées", async () => {
      const token = await loginAs("client@gmail.com");
      const vetoProfile = await getPrisma().veterinarianProfile.findFirst({
        where: { veterinarianClinics: { some: {} } },
      });

      const res = await request(app)
        .get(`/api/veterinarians/${vetoProfile!.id}/pets`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── PATCH /:id/pets ───────────────────────────────────────────────────────
  describe("PATCH /api/veterinarians/:veterinarianId/pets", () => {
    it("401 — sans token", async () => {
      const res = await request(app)
        .patch("/api/veterinarians/some-id/pets")
        .send({ petIds: [] });
      expect(res.status).toBe(401);
    });

    it("403 — rôle non-VETERINARIAN non autorisé", async () => {
      const token = await loginAs("secretaire@gmail.com");
      const res = await request(app)
        .patch("/api/veterinarians/some-id/pets")
        .set("Authorization", `Bearer ${token}`)
        .send({ petIds: [] });
      expect(res.status).toBe(403);
    });

    it("400 — corps invalide (petIds manquant)", async () => {
      const token = await loginAs("veto@gmail.com");
      const vetoProfile = await getPrisma().veterinarianProfile.findFirst({
        where: { veterinarianClinics: { some: {} } },
      });

      const res = await request(app)
        .patch(`/api/veterinarians/${vetoProfile!.id}/pets`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("200 — VETERINARIAN met à jour ses espèces acceptées", async () => {
      const token = await loginAs("veto@gmail.com");
      const vetoProfile = await getPrisma().veterinarianProfile.findFirst({
        where: { veterinarianClinics: { some: {} } },
      });
      const pet = await getPrisma().pet.findFirst();

      const res = await request(app)
        .patch(`/api/veterinarians/${vetoProfile!.id}/pets`)
        .set("Authorization", `Bearer ${token}`)
        .send({ petIds: pet ? [pet.id] : [] });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
