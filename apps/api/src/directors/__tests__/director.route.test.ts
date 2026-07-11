import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { hash } from "bcryptjs";
import { getPrisma } from "../../../__tests__/setup";
import { app } from "@api/app";

// Ces tests créent leur propre clinique + directeur (au lieu de réutiliser
// directeur@gmail.com / clinic1 du seed) pour ne jamais modifier la liste du
// personnel de clinic1, dont dépendent d'autres suites (user.router,
// animal-meeting...) qui tournent en parallèle sur la même base de test.
describe("Director staff routes", () => {
  const directorEmail = "directeur-test-staff@test.com";
  const clinicSiret = "90000000000001";
  let directorToken: string;
  let directorClinicId: string;

  beforeAll(async () => {
    const password = await hash("Password123!", 10);

    const clinic = await getPrisma().clinic.create({
      data: {
        name: "Clinique de test (staff directeur)",
        street: "1 rue du Test",
        postalCode: "75001",
        city: "Paris",
        siret: clinicSiret,
        phone: "0102030405",
        website: "https://test-staff-directeur.fr",
      },
    });
    directorClinicId = clinic.id;

    await getPrisma().user.create({
      data: {
        email: directorEmail,
        firstname: "Test",
        lastname: "Directeur",
        password,
        role: "DIRECTOR",
        directorClinicProfile: { create: { clinicId: clinic.id } },
      },
    });

    const login = await request(app).post("/api/auth/login").send({
      email: directorEmail,
      password: "Password123!",
    });
    directorToken = login.body.accessToken;
  });

  afterAll(async () => {
    await getPrisma().refreshToken.deleteMany({
      where: { user: { email: directorEmail } },
    });
    await getPrisma().directorClinicProfile.deleteMany({
      where: { user: { email: directorEmail } },
    });
    await getPrisma().user.deleteMany({ where: { email: directorEmail } });
    await getPrisma().clinic.deleteMany({ where: { id: directorClinicId } });
  });

  // -----------------------------------------------------------------
  describe("POST /api/director/staff/referents", () => {
    const email = "nouveau-referent@test.com";

    beforeEach(async () => {
      await getPrisma().refreshToken.deleteMany({ where: { user: { email } } });
      await getPrisma().referentClinicProfile.deleteMany({
        where: { user: { email } },
      });
      await getPrisma().user.deleteMany({ where: { email } });
    });

    afterAll(async () => {
      await getPrisma().referentClinicProfile.deleteMany({
        where: { user: { email } },
      });
      await getPrisma().user.deleteMany({ where: { email } });
    });

    it("201 — crée un référent sans mot de passe dans le body", async () => {
      const res = await request(app)
        .post("/api/director/staff/referents")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ email, firstname: "Nouveau", lastname: "Referent" });

      expect(res.status).toBe(201);
      expect(res.body).not.toHaveProperty("password");
      expect(res.body.role).toBe("REFERANT");

      const user = await getPrisma().user.findUnique({ where: { email } });
      expect(user).not.toBeNull();
    });

    it("un mot de passe envoyé dans le body est ignoré (mdp généré côté serveur)", async () => {
      const res = await request(app)
        .post("/api/director/staff/referents")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({
          email,
          firstname: "Nouveau",
          lastname: "Referent",
          password: "JeVeuxCeMotDePasse1!",
        });
      expect(res.status).toBe(201);

      const login = await request(app).post("/api/auth/login").send({
        email,
        password: "JeVeuxCeMotDePasse1!",
      });
      expect(login.status).toBe(401);
    });

    it("401 — sans token", async () => {
      const res = await request(app)
        .post("/api/director/staff/referents")
        .send({ email, firstname: "Nouveau", lastname: "Referent" });
      expect(res.status).toBe(401);
    });
  });

  // -----------------------------------------------------------------
  describe("POST /api/director/staff/veterinarians", () => {
    const email = "nouveau-veto@test.com";

    beforeEach(async () => {
      await getPrisma().refreshToken.deleteMany({ where: { user: { email } } });
      await getPrisma().veterinarianClinic.deleteMany({
        where: { veterinarian: { user: { email } } },
      });
      await getPrisma().veterinarianProfile.deleteMany({
        where: { user: { email } },
      });
      await getPrisma().user.deleteMany({ where: { email } });
    });

    afterAll(async () => {
      await getPrisma().veterinarianClinic.deleteMany({
        where: { veterinarian: { user: { email } } },
      });
      await getPrisma().veterinarianProfile.deleteMany({
        where: { user: { email } },
      });
      await getPrisma().user.deleteMany({ where: { email } });
    });

    it("201 — crée un vétérinaire avec un numéro de licence valide", async () => {
      const res = await request(app)
        .post("/api/director/staff/veterinarians")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({
          email,
          firstname: "Nouveau",
          lastname: "Veto",
          licenseNumber: "VET-999",
        });

      expect(res.status).toBe(201);
      expect(res.body).not.toHaveProperty("password");
    });

    it("400 — numéro de licence trop court", async () => {
      const res = await request(app)
        .post("/api/director/staff/veterinarians")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ email, firstname: "Nouveau", lastname: "Veto", licenseNumber: "ab" });
      expect(res.status).toBe(400);
    });

    it("400 — numéro de licence avec caractères invalides", async () => {
      const res = await request(app)
        .post("/api/director/staff/veterinarians")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({
          email,
          firstname: "Nouveau",
          lastname: "Veto",
          licenseNumber: "VET 001!",
        });
      expect(res.status).toBe(400);
    });

    it("409 — numéro de licence déjà utilisé", async () => {
      const res = await request(app)
        .post("/api/director/staff/veterinarians")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({
          email,
          firstname: "Nouveau",
          lastname: "Veto",
          licenseNumber: "VET-001",
        });
      expect(res.status).toBe(409);
    });
  });

  // -----------------------------------------------------------------
  describe("GET /search & POST /link — vétérinaire existant", () => {
    const email = "veto-a-lier-director@test.com";
    let vetId: string;

    beforeEach(async () => {
      await getPrisma().veterinarianClinic.deleteMany({
        where: { veterinarian: { user: { email } } },
      });
      await getPrisma().veterinarianProfile.deleteMany({
        where: { user: { email } },
      });
      await getPrisma().user.deleteMany({ where: { email } });

      const password = await hash("Password123!", 10);
      const user = await getPrisma().user.create({
        data: {
          email,
          firstname: "Libre",
          lastname: "Veto",
          password,
          role: "VETERINARIAN",
          veterinarianProfile: {
            create: { licenseNumber: "VET-LIBRE-DIR-001" },
          },
        },
      });
      vetId = user.id;
    });

    afterAll(async () => {
      await getPrisma().veterinarianClinic.deleteMany({
        where: { veterinarian: { user: { email } } },
      });
      await getPrisma().veterinarianProfile.deleteMany({
        where: { user: { email } },
      });
      await getPrisma().user.deleteMany({ where: { email } });
    });

    it("200 — recherche par numéro de licence", async () => {
      const res = await request(app)
        .get("/api/director/staff/veterinarians/search?q=VET-LIBRE-DIR-001")
        .set("Authorization", `Bearer ${directorToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(vetId);
    });

    it("200 — recherche par email", async () => {
      const res = await request(app)
        .get(`/api/director/staff/veterinarians/search?q=${encodeURIComponent(email)}`)
        .set("Authorization", `Bearer ${directorToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("200 — recherche sans résultat", async () => {
      const res = await request(app)
        .get("/api/director/staff/veterinarians/search?q=inconnu@test.com")
        .set("Authorization", `Bearer ${directorToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    it("201 — lie le vétérinaire trouvé à la clinique", async () => {
      const res = await request(app)
        .post("/api/director/staff/veterinarians/link")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ veterinarianId: vetId });
      expect(res.status).toBe(201);

      const link = await getPrisma().veterinarianClinic.findFirst({
        where: { veterinarianId: vetId, clinicId: directorClinicId },
      });
      expect(link).not.toBeNull();
    });

    it("le vétérinaire lié disparaît des résultats de recherche", async () => {
      await request(app)
        .post("/api/director/staff/veterinarians/link")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ veterinarianId: vetId });

      const res = await request(app)
        .get("/api/director/staff/veterinarians/search?q=VET-LIBRE-DIR-001")
        .set("Authorization", `Bearer ${directorToken}`);
      expect(res.body).toHaveLength(0);
    });

    it("409 — lier deux fois le même vétérinaire", async () => {
      await request(app)
        .post("/api/director/staff/veterinarians/link")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ veterinarianId: vetId });

      const res = await request(app)
        .post("/api/director/staff/veterinarians/link")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ veterinarianId: vetId });
      expect(res.status).toBe(409);
    });

    it("404 — lier un id de vétérinaire inexistant", async () => {
      const res = await request(app)
        .post("/api/director/staff/veterinarians/link")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ veterinarianId: "00000000-0000-0000-0000-000000000000" });
      expect(res.status).toBe(404);
    });

    it("400 — id de vétérinaire mal formé", async () => {
      const res = await request(app)
        .post("/api/director/staff/veterinarians/link")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ veterinarianId: "pas-un-uuid" });
      expect(res.status).toBe(400);
    });
  });

  // -----------------------------------------------------------------
  describe("DELETE /api/director/staff/:id", () => {
    it("200 — retire un vétérinaire de la clinique sans supprimer son compte", async () => {
      const email = "veto-a-retirer-director@test.com";
      await getPrisma().veterinarianClinic.deleteMany({
        where: { veterinarian: { user: { email } } },
      });
      await getPrisma().veterinarianProfile.deleteMany({ where: { user: { email } } });
      await getPrisma().user.deleteMany({ where: { email } });

      const password = await hash("Password123!", 10);
      const vet = await getPrisma().user.create({
        data: {
          email,
          firstname: "A",
          lastname: "Retirer",
          password,
          role: "VETERINARIAN",
          veterinarianProfile: {
            create: {
              licenseNumber: "VET-RETRAIT-001",
              veterinarianClinic: { create: { clinicId: directorClinicId } },
            },
          },
        },
      });

      const res = await request(app)
        .delete(`/api/director/staff/${vet.id}`)
        .set("Authorization", `Bearer ${directorToken}`);
      expect(res.status).toBe(200);

      const link = await getPrisma().veterinarianClinic.findFirst({
        where: { veterinarianId: vet.id, clinicId: directorClinicId },
      });
      expect(link).toBeNull();

      const stillExists = await getPrisma().user.findUnique({ where: { id: vet.id } });
      expect(stillExists).not.toBeNull();

      await getPrisma().veterinarianProfile.deleteMany({ where: { user: { email } } });
      await getPrisma().user.deleteMany({ where: { email } });
    });

    it("200 — supprime un référent même avec disponibilité, réunion interne et conversation liées", async () => {
      const email = "referent-a-supprimer@test.com";
      await getPrisma().user.deleteMany({ where: { email } });

      const password = await hash("Password123!", 10);
      const referent = await getPrisma().user.create({
        data: {
          email,
          firstname: "A",
          lastname: "Supprimer",
          password,
          role: "REFERANT",
          referentClinicProfile: { create: { clinicId: directorClinicId } },
        },
      });

      await getPrisma().availability.create({
        data: { userId: referent.id, clinicId: directorClinicId },
      });
      const internalMeeting = await getPrisma().internalMeeting.create({
        data: {
          title: "Réunion test suppression",
          adminId: referent.id,
          clinicId: directorClinicId,
        },
      });
      await getPrisma().internalMeetingParticipant.create({
        data: { meetingId: internalMeeting.id, userId: referent.id, status: "ACCEPTED" },
      });
      const conversation = await getPrisma().conversation.create({
        data: {
          type: "GROUP",
          scope: "CLINIC",
          createdById: referent.id,
          clinicId: directorClinicId,
        },
      });

      const res = await request(app)
        .delete(`/api/director/staff/${referent.id}`)
        .set("Authorization", `Bearer ${directorToken}`);
      expect(res.status).toBe(200);

      const stillExists = await getPrisma().user.findUnique({ where: { id: referent.id } });
      expect(stillExists).toBeNull();

      const conversationAfter = await getPrisma().conversation.findUnique({
        where: { id: conversation.id },
      });
      expect(conversationAfter).not.toBeNull();
      expect(conversationAfter!.createdById).toBeNull();

      await getPrisma().conversation.deleteMany({ where: { id: conversation.id } });
    });

    it("404 — utilisateur d'une autre clinique", async () => {
      const res = await request(app)
        .delete("/api/director/staff/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${directorToken}`);
      expect(res.status).toBe(404);
    });
  });
});
