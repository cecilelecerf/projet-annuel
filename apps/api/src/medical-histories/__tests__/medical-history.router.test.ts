import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { getPrisma } from "../../../__tests__/setup";

import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";

// ── Helpers de setup dédiés à ce fichier ──────────────────────────────────────

async function createDisposableAnimalWithClinicAct() {
  // Récupère les comptes/clinique déjà seedés pour rattacher les ressources
  const client = await getPrisma().user.findUniqueOrThrow({
    where: { email: "client@gmail.com" },
    include: { clientProfile: true },
  });
  const veto = await getPrisma().user.findUniqueOrThrow({
    where: { email: "veto@gmail.com" },
    include: {
      veterinarianProfile: { include: { veterinarianClinics: true } },
    },
  });
  const clinic = await getPrisma().clinic.findFirstOrThrow();

  const race = await getPrisma().race.findFirstOrThrow();

  const animal = await getPrisma().animal.create({
    data: {
      name: `Animal-${Date.now()}`,
      dateOfBirth: new Date("2022-01-01"),
      clientId: client.clientProfile!.id,
      raceId: race.id,
    },
  });

  const act = await getPrisma().act.create({
    data: { name: `Acte-${Date.now()}`, type: "CONSULTATION", basePrice: 30 },
  });

  const clinicAct = await getPrisma().clinicAct.create({
    data: { actId: act.id, clinicId: clinic.id, price: 35 },
  });

  const veterinarianClinic = veto.veterinarianProfile!.veterinarianClinics.find(
    (vc) => vc.clinicId === clinic.id,
  );

  return { client, veto, clinic, animal, act, clinicAct, veterinarianClinic };
}

async function createDisposableMeeting(
  clinicId: string,
  animalId: string,
  veterinarianClinicId: string,
) {
  const meeting = await getPrisma().meetingBase.create({
    data: {
      kind: "ANIMAL",
      date: "2028-08-30T09:42:00.000Z",
      startTime: "1970-01-01T09:42:00.000Z",
      endTime: "1970-01-01T09:45:00.000Z",
      animalMeeting: {
        create: {
          animalId,
          veterinarianClinicId,
        },
      },
    },
    include: { animalMeeting: true },
  });

  return { meeting };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("animalMedicalHistoryRouter", () => {
  let clientToken: string;
  let vetoToken: string;
  let secretaireToken: string;
  let referentToken: string;
  let adminToken: string;

  beforeAll(async () => {
    clientToken = await loginAs("client@gmail.com");
    vetoToken = await loginAs("veto@gmail.com");
    secretaireToken = await loginAs("secretaire@gmail.com");
    referentToken = await loginAs("referent@gmail.com");
    adminToken = await loginAs("admin@gmail.com");
  });

  // ── POST / (create) ──────────────────────────────────────────────────────

  describe("POST /medical-histories", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).post("/api/medical-histories").send({});
      expect(res.status).toBe(401);
    });

    it("403 pour un rôle non autorisé par roleMiddleware (REFERENT)", async () => {
      const res = await request(app)
        .post("/api/medical-histories")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ type: "free" });

      expect(res.status).toBe(403);
    });

    it("400 si le body ne respecte pas createMedicalHistorySchema", async () => {
      const res = await request(app)
        .post("/api/medical-histories")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ type: "free" }); // actId/animalId/performedAt manquants
      expect(res.status).toBe(400);
    });

    it("201 — CLIENT crée une entrée libre sur son propre animal", async () => {
      const { client, animal, act } =
        await createDisposableAnimalWithClinicAct();

      const res = await request(app)
        .post("/api/medical-histories")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({
          type: "free",
          animalId: animal.id,
          actId: act.id,
          performedAt: new Date().toISOString(),
        });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        actId: act.id,
        animalId: animal.id,
        animalMeetingId: null,
      });
    });

    it("403 — CLIENT tente de créer sur l'animal d'un autre client", async () => {
      const { animal, act } = await createDisposableAnimalWithClinicAct();
      // animal appartient à client@gmail.com, on l'attaque avec un autre client seedé
      const otherClientToken = await loginAs("thomas.blanc@email.fr");

      const res = await request(app)
        .post("/api/medical-histories")
        .set("Authorization", `Bearer ${otherClientToken}`)
        .send({
          type: "free",
          animalId: animal.id,
          actId: act.id,
          performedAt: new Date().toISOString(),
        });

      expect(res.status).toBe(403);
    });

    it("201 — VETERINARIAN crée une entrée liée à un RDV", async () => {
      const { animal, clinicAct, clinic, veterinarianClinic } =
        await createDisposableAnimalWithClinicAct();
      const { meeting } = await createDisposableMeeting(
        clinic.id,
        animal.id,
        veterinarianClinic!.id,
      );

      const res = await request(app)
        .post("/api/medical-histories")
        .set("Authorization", `Bearer ${vetoToken}`)
        .send({
          type: "meeting",
          animalMeetingId: meeting.id,
          clinicActId: clinicAct.id,
          performedAt: meeting.date.toISOString(),
          notes: "",
        });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ clinicActId: clinicAct.id });
    });
  });

  // ── PATCH /:id (update) ──────────────────────────────────────────────────

  describe("PATCH /medical-histories/:id", () => {
    it("401 sans authentification", async () => {
      const res = await request(app)
        .patch("/api/medical-histories/some-id")
        .send({});
      expect(res.status).toBe(401);
    });

    it("403 pour un rôle non autorisé par roleMiddleware (SECRETARY)", async () => {
      const res = await request(app)
        .patch("/api/medical-histories/some-id")
        .set("Authorization", `Bearer ${secretaireToken}`)
        .send({ type: "free" });
      expect(res.status).toBe(403);
    });

    it("400 si le body ne respecte pas updateMedicalHistorySchema", async () => {
      const { client, animal, act } =
        await createDisposableAnimalWithClinicAct();
      const history = await getPrisma().animalMedicalHistory.create({
        data: {
          performedAt: new Date(),
          animalId: animal.id,
          actId: act.id,
          type: "CONSULTATION",
        },
      });

      const res = await request(app)
        .patch(`/api/medical-histories/${history.id}`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ type: "not-a-valid-literal" });

      expect(res.status).toBe(400);
    });

    it("404 si l'acte n'existe pas", async () => {
      const res = await request(app)
        .patch("/api/medical-histories/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ type: "free", notes: "Test" });
      expect(res.status).toBe(404);
    });

    it("200 — CLIENT modifie sa propre entrée libre", async () => {
      const { animal, act } = await createDisposableAnimalWithClinicAct();
      const history = await getPrisma().animalMedicalHistory.create({
        data: {
          performedAt: new Date(),
          animalId: animal.id,
          actId: act.id,
          type: "CONSULTATION",
        },
      });

      const res = await request(app)
        .patch(`/api/medical-histories/${history.id}`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ type: "free", notes: "Mise à jour" });

      expect(res.status).toBe(200);
      expect(res.body.notes).toBe("Mise à jour");
    });

    it("403 — CLIENT tente de modifier une entrée liée à un RDV", async () => {
      const { animal, clinicAct, clinic, veterinarianClinic } =
        await createDisposableAnimalWithClinicAct();
      const { meeting } = await createDisposableMeeting(
        clinic.id,
        animal.id,
        veterinarianClinic!.id,
      );
      const history = await getPrisma().animalMedicalHistory.create({
        data: {
          performedAt: new Date(),
          animalId: animal.id,
          actId: clinicAct.actId,
          clinicActId: clinicAct.id,
          animalMeetingId: meeting.animalMeeting!.id,
          type: "CONSULTATION",
          priceApplied: clinicAct.price,
        },
      });

      const res = await request(app)
        .patch(`/api/medical-histories/${history.id}`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ type: "meeting", notes: "Tentative" });

      expect(res.status).toBe(403);
    });
  });

  // ── DELETE /:id ──────────────────────────────────────────────────────────

  describe("DELETE /medical-histories/:id", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).delete("/api/medical-histories/some-id");
      expect(res.status).toBe(401);
    });

    it("403 pour un rôle non autorisé par roleMiddleware (CLIENT)", async () => {
      const res = await request(app)
        .delete("/api/medical-histories/some-id")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });

    it("404 si l'acte n'existe pas", async () => {
      const res = await request(app)
        .delete("/api/medical-histories/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${vetoToken}`);
      expect(res.status).toBe(404);
    });

    it("204 — VETERINARIAN supprime une entrée de sa clinique", async () => {
      const { animal, act } = await createDisposableAnimalWithClinicAct();
      const history = await getPrisma().animalMedicalHistory.create({
        data: {
          performedAt: new Date(),
          animalId: animal.id,
          actId: act.id,
          type: "CONSULTATION",
        },
      });

      const res = await request(app)
        .delete(`/api/medical-histories/${history.id}`)
        .set("Authorization", `Bearer ${vetoToken}`);

      expect(res.status).toBe(204);

      const stillExists = await getPrisma().animalMedicalHistory.findUnique({
        where: { id: history.id },
      });
      expect(stillExists).toBeNull();
    });
  });

  // ── GET /:id/files ───────────────────────────────────────────────────────

  describe("GET /medical-histories/:id/files", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).get(
        "/api/medical-histories/some-id/files",
      );
      expect(res.status).toBe(401);
    });

    it("200 — tableau vide si l'acte n'a pas de sous-modèle imaging/analysis", async () => {
      const { animal, act } = await createDisposableAnimalWithClinicAct();
      const history = await getPrisma().animalMedicalHistory.create({
        data: {
          performedAt: new Date(),
          animalId: animal.id,
          actId: act.id,
          type: "CONSULTATION",
        },
      });

      const res = await request(app)
        .get(`/api/medical-histories/${history.id}/files`)
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("403 — un client ne peut pas voir les fichiers de l'animal d'un autre", async () => {
      const { animal, act } = await createDisposableAnimalWithClinicAct();
      const history = await getPrisma().animalMedicalHistory.create({
        data: {
          performedAt: new Date(),
          animalId: animal.id,
          actId: act.id,
          type: "ANALYSIS",
          analysis: { create: { analysisType: "BLOOD", status: "PENDING" } },
        },
      });
      const otherClientToken = await loginAs("thomas.blanc@email.fr");
      const res = await request(app)
        .get(`/api/medical-histories/${history.id}/files`)
        .set("Authorization", `Bearer ${otherClientToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ── POST /:id/files/upload ───────────────────────────────────────────────

  describe("POST /medical-histories/:id/files/upload", () => {
    it("401 sans authentification", async () => {
      const res = await request(app)
        .post("/api/medical-histories/some-id/files/upload")
        .send({ mimeType: "image/jpeg" });
      expect(res.status).toBe(401);
    });

    it("400 — acte sans sous-modèle imaging/analysis", async () => {
      const { animal, act } = await createDisposableAnimalWithClinicAct();
      const history = await getPrisma().animalMedicalHistory.create({
        data: {
          performedAt: new Date(),
          animalId: animal.id,
          actId: act.id,
          type: "CONSULTATION",
        },
      });

      const res = await request(app)
        .post(`/api/medical-histories/${history.id}/files/upload`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ mimeType: "image/jpeg" });

      expect(res.status).toBe(400);
    });

    it("201 — génère une URL d'upload pour un acte imaging", async () => {
      const { animal, act } = await createDisposableAnimalWithClinicAct();
      const imagingAct = await getPrisma().act.create({
        data: { name: "Radio", type: "IMAGING", basePrice: 50 },
      });
      const history = await getPrisma().animalMedicalHistory.create({
        data: {
          performedAt: new Date(),
          animalId: animal.id,
          actId: imagingAct.id,
          type: "IMAGING",
          imaging: { create: { imagingType: "XRAY" } },
        },
      });

      const res = await request(app)
        .post(`/api/medical-histories/${history.id}/files/upload`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ mimeType: "image/jpeg" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("uploadUrl");
      expect(res.body).toHaveProperty("fileId");
    });
  });

  // ── PATCH /:id/files/:fileId/confirm ─────────────────────────────────────

  describe("PATCH /medical-histories/:id/files/:fileId/confirm", () => {
    it("401 sans authentification", async () => {
      const res = await request(app).patch(
        "/api/medical-histories/some-id/files/some-file-id/confirm",
      );
      expect(res.status).toBe(401);
    });

    it("400 — acte sans sous-modèle imaging/analysis", async () => {
      const { animal, act } = await createDisposableAnimalWithClinicAct();
      const history = await getPrisma().animalMedicalHistory.create({
        data: {
          performedAt: new Date(),
          animalId: animal.id,
          actId: act.id,
          type: "CONSULTATION",
        },
      });

      const res = await request(app)
        .patch(
          `/api/medical-histories/${history.id}/files/fake-file-id/confirm`,
        )
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(400);
    });

    // Test de bout en bout (upload réel + confirm) nécessite un vrai flux
    // S3/MinIO — dépend de votre setup Testcontainers pour MinIO. À compléter
    // si un container MinIO est disponible dans vos tests d'intégration,
    // sinon ce endpoint reste couvert par les tests unitaires du service.
  });
});
