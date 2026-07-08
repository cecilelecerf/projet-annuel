import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
import { getPrisma } from "../../../__tests__/setup";

describe("VeterinarianClinic router", () => {
  let clientToken: string;
  let directorToken: string;
  let vetToken: string;
  let vetClinicId: string;
  let secretaryToken: string;
  let referentToken: string;
  beforeAll(async () => {
    clientToken = await loginAs("client@gmail.com");
    directorToken = await loginAs("directeur@gmail.com");
    referentToken = await loginAs("referent@gmail.com");
    vetToken = await loginAs("veto@gmail.com");
    secretaryToken = await loginAs("secretaire@gmail.com");

    const prisma = getPrisma();
    const vetClinic = await prisma.veterinarianClinic.findFirst();
    if (!vetClinic)
      throw new Error("Aucune association véto/clinique seedée pour les tests");
    vetClinicId = vetClinic.id;
  });

  // ── GET /:id/review/me ───────────────────────────────────────────────────

  describe("GET /api/veterinarian-clinics/:id/review/me", () => {
    it("200 — CLIENT reçoit son avis (ou null) pour ce véto", async () => {
      const res = await request(app)
        .get(`/api/veterinarian-clinics/${vetClinicId}/review/me`)
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
    });

    it("401 — sans token", async () => {
      const res = await request(app).get(
        `/api/veterinarian-clinics/${vetClinicId}/review/me`,
      );
      expect(res.status).toBe(401);
    });

    it("403 — DIRECTOR ne peut pas accéder à cette route réservée aux CLIENT", async () => {
      const res = await request(app)
        .get(`/api/veterinarian-clinics/${vetClinicId}/review/me`)
        .set("Authorization", `Bearer ${directorToken}`);
      expect(res.status).toBe(403);
    });

    it("403 — VETERINARIAN ne peut pas accéder à cette route réservée aux CLIENT", async () => {
      const res = await request(app)
        .get(`/api/veterinarian-clinics/${vetClinicId}/review/me`)
        .set("Authorization", `Bearer ${vetToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── GET /:id/review ──────────────────────────────────────────────────────

  describe("GET /api/veterinarian-clinics/:id/review", () => {
    it("200 — DIRECTOR reçoit les avis du véto", async () => {
      const res = await request(app)
        .get(`/api/veterinarian-clinics/${vetClinicId}/review`)
        .set("Authorization", `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("200 — REFERENT reçoit les avis du véto", async () => {
      const res = await request(app)
        .get(`/api/veterinarian-clinics/${vetClinicId}/review`)
        .set("Authorization", `Bearer ${referentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("401 — sans token", async () => {
      const res = await request(app).get(
        `/api/veterinarian-clinics/${vetClinicId}/review`,
      );
      expect(res.status).toBe(401);
    });

    it("403 — CLIENT ne peut pas accéder à cette route réservée au staff", async () => {
      const res = await request(app)
        .get(`/api/veterinarian-clinics/${vetClinicId}/review`)
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });

    it("403 — VETERINARIAN ne peut pas accéder à cette route", async () => {
      const res = await request(app)
        .get(`/api/veterinarian-clinics/${vetClinicId}/review`)
        .set("Authorization", `Bearer ${vetToken}`);
      expect(res.status).toBe(403);
    });

    it("403 — SECRETARY ne peut pas accéder à cette route", async () => {
      const res = await request(app)
        .get(`/api/veterinarian-clinics/${vetClinicId}/review`)
        .set("Authorization", `Bearer ${secretaryToken}`);
      expect(res.status).toBe(403);
    });
  });
});
