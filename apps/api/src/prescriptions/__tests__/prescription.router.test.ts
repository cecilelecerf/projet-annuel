import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
import { getPrisma } from "../../../__tests__/setup";

describe("Prescription router", () => {
  let vetToken: string;
  let clientToken: string;
  let directorToken: string;
  let animalMeetingId: string;
  let veterinarianId: string;
  let prescriptionId: string;

  beforeAll(async () => {
    vetToken = await loginAs("veto@gmail.com");
    clientToken = await loginAs("client@gmail.com");
    directorToken = await loginAs("directeur@gmail.com");

    const prisma = getPrisma();

    const vetUser = await prisma.user.findUnique({
      where: { email: "veto@gmail.com" },
    });
    if (!vetUser) throw new Error("Utilisateur veto@gmail.com introuvable");
    veterinarianId = vetUser.id;

    const animalMeeting = await prisma.animalMeeting.findFirst({
      where: { veterinarianClinic: { veterinarianId } },
    });
    if (!animalMeeting)
      throw new Error("Aucun animalMeeting seedé pour ce vétérinaire");
    animalMeetingId = animalMeeting.id;

    // Crée une prescription de référence via l'API elle-même, pour être sûr
    // qu'elle respecte le vrai contrat de validation/écriture.
    const createRes = await request(app)
      .post("/api/prescriptions")
      .set("Authorization", `Bearer ${vetToken}`)
      .send({
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-01-15T00:00:00.000Z",
        status: "ACTIVE",
        notes: "Prescription de référence pour les tests",
        animalMeetingId,
        veterinarianId,
        items: [
          {
            medicationName: "Amoxicilline",
            dosage: "250mg",
            frequency: "2x/jour",
            duration: 10,
          },
        ],
      });

    if (createRes.status !== 201) {
      throw new Error(
        `Impossible de créer la prescription de référence : ${createRes.status} ${JSON.stringify(createRes.body)}`,
      );
    }
    prescriptionId = createRes.body.id;
  });

  // ── GET /api/prescriptions/:id ───────────────────────────────────────────
  // Pas de roleMiddleware sur cette route — tout rôle authentifié avec une
  // clinique approuvée peut consulter une prescription par id.

  describe("GET /api/prescriptions/:id", () => {
    it("200 — VETERINARIAN reçoit la prescription", async () => {
      const res = await request(app)
        .get(`/api/prescriptions/${prescriptionId}`)
        .set("Authorization", `Bearer ${vetToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(prescriptionId);
    });

    it("200 — CLIENT reçoit la prescription (aucune restriction de rôle sur cette route)", async () => {
      const res = await request(app)
        .get(`/api/prescriptions/${prescriptionId}`)
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
    });

    it("404 — prescription inexistante", async () => {
      const res = await request(app)
        .get("/api/prescriptions/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${vetToken}`);

      expect(res.status).toBe(404);
    });

    it("401 — sans token", async () => {
      const res = await request(app).get(
        `/api/prescriptions/${prescriptionId}`,
      );
      expect(res.status).toBe(401);
    });
  });

  // ── POST /api/prescriptions ──────────────────────────────────────────────

  describe("POST /api/prescriptions", () => {
    it("401 — sans token", async () => {
      const res = await request(app).post("/api/prescriptions").send({});
      expect(res.status).toBe(401);
    });

    it("403 — CLIENT ne peut pas créer de prescription", async () => {
      const res = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it("403 — DIRECTOR ne peut pas créer de prescription", async () => {
      const res = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it("400 — body invalide (items manquant)", async () => {
      const res = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          startDate: "2026-01-01T00:00:00.000Z",
          endDate: "2026-01-15T00:00:00.000Z",
          status: "ACTIVE",
          animalMeetingId,
          veterinarianId,
        });

      expect(res.status).toBe(400);
    });

    it("201 — VETERINARIAN crée une prescription", async () => {
      const res = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          startDate: "2026-02-01T00:00:00.000Z",
          endDate: "2026-02-15T00:00:00.000Z",
          status: "ACTIVE",
          notes: "Nouvelle prescription",
          animalMeetingId,
          veterinarianId,
          items: [
            {
              medicationName: "Doliprane",
              dosage: "500mg",
              frequency: "3x/jour",
              duration: 5,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].medicationName).toBe("Doliprane");
    });
  });

  // ── PATCH /api/prescriptions/:id ─────────────────────────────────────────

  describe("PATCH /api/prescriptions/:id", () => {
    it("403 — CLIENT ne peut pas modifier une prescription", async () => {
      const res = await request(app)
        .patch(`/api/prescriptions/${prescriptionId}`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ notes: "Tentative" });
      expect(res.status).toBe(403);
    });

    it("403 — DIRECTOR ne peut pas modifier une prescription", async () => {
      const res = await request(app)
        .patch(`/api/prescriptions/${prescriptionId}`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ notes: "Tentative" });
      expect(res.status).toBe(403);
    });

    it("200 — VETERINARIAN modifie les notes", async () => {
      const res = await request(app)
        .patch(`/api/prescriptions/${prescriptionId}`)
        .set("Authorization", `Bearer ${vetToken}`)
        .send({ notes: "Notes mises à jour" });

      expect(res.status).toBe(200);
      expect(res.body.notes).toBe("Notes mises à jour");
    });

    it("200 — VETERINARIAN remplace les items (deleteMany + create)", async () => {
      const res = await request(app)
        .patch(`/api/prescriptions/${prescriptionId}`)
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          items: [
            {
              medicationName: "Paracétamol",
              dosage: "1g",
              frequency: "1x/jour",
              duration: 3,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].medicationName).toBe("Paracétamol");
    });

    it("404 — prescription inexistante", async () => {
      const res = await request(app)
        .patch("/api/prescriptions/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({ notes: "X" });
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/prescriptions/:id ────────────────────────────────────────

  describe("DELETE /api/prescriptions/:id", () => {
    it("403 — CLIENT ne peut pas supprimer une prescription", async () => {
      const res = await request(app)
        .delete(`/api/prescriptions/${prescriptionId}`)
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });

    it("204 — VETERINARIAN supprime une prescription jetable", async () => {
      const prisma = getPrisma();

      const createRes = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          startDate: "2026-03-01T00:00:00.000Z",
          endDate: "2026-03-15T00:00:00.000Z",
          status: "ACTIVE",
          animalMeetingId,
          veterinarianId,
          items: [
            {
              medicationName: "Jetable",
              dosage: "1mg",
              frequency: "1x/jour",
              duration: 1,
            },
          ],
        });
      expect(createRes.status).toBe(201);
      const disposableId = createRes.body.id;

      const res = await request(app)
        .delete(`/api/prescriptions/${disposableId}`)
        .set("Authorization", `Bearer ${vetToken}`);
      expect(res.status).toBe(204);

      const check = await prisma.prescription.findUnique({
        where: { id: disposableId },
      });
      expect(check).toBeNull();
    });

    it("404 — prescription inexistante", async () => {
      const res = await request(app)
        .delete("/api/prescriptions/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${vetToken}`);
      expect(res.status).toBe(404);
    });
  });
});
