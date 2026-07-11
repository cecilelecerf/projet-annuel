import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { getPrisma } from "../../../__tests__/setup";
const validQuery = "startDate=2026-01-01&endDate=2026-12-31";

// ── GET /api/veterinarians/:veterinarianId ──────────────────────────────/calendar──
describe("Vetrinarian router", () => {
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
            some: {}, // au moins une VeterinarianClinic liée
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

  // ── GET /api/veterinarians/:veterinarianId/meetings/slots ────────────────────

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
      console.log(res.body);
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
});
