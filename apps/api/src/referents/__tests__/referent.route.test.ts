import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { hash } from "bcryptjs";
import { getPrisma } from "../../../__tests__/setup";
import { app } from "@api/app";

// Ces tests créent leur propre clinique + référent (au lieu de réutiliser
// referent@gmail.com / clinic1 du seed) pour ne jamais modifier la liste du
// personnel de clinic1, dont dépendent d'autres suites (user.router,
// animal-meeting...) qui tournent en parallèle sur la même base de test.
describe("Referent staff routes", () => {
  const referentEmail = "referent-test-staff@test.com";
  const clinicSiret = "90000000000002";
  let referentToken: string;
  let referentClinicId: string;

  beforeAll(async () => {
    const password = await hash("Password123!", 10);

    const clinic = await getPrisma().clinic.create({
      data: {
        name: "Clinique de test (staff référent)",
        street: "2 rue du Test",
        postalCode: "75001",
        city: "Paris",
        siret: clinicSiret,
        phone: "0102030406",
        website: "https://test-staff-referent.fr",
      },
    });
    referentClinicId = clinic.id;

    await getPrisma().user.create({
      data: {
        email: referentEmail,
        firstname: "Test",
        lastname: "Referent",
        password,
        role: "REFERANT",
        referentClinicProfile: { create: { clinicId: clinic.id } },
      },
    });

    const login = await request(app).post("/api/auth/login").send({
      email: referentEmail,
      password: "Password123!",
    });
    referentToken = login.body.accessToken;
  });

  afterAll(async () => {
    await getPrisma().refreshToken.deleteMany({
      where: { user: { email: referentEmail } },
    });
    await getPrisma().referentClinicProfile.deleteMany({
      where: { user: { email: referentEmail } },
    });
    await getPrisma().user.deleteMany({ where: { email: referentEmail } });
    await getPrisma().clinic.deleteMany({ where: { id: referentClinicId } });
  });

  // -----------------------------------------------------------------
  describe("POST /api/referent/staff/veterinarians", () => {
    const email = "nouveau-veto-referent@test.com";

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

    it("201 — crée un vétérinaire sans mot de passe dans le body", async () => {
      const res = await request(app)
        .post("/api/referent/staff/veterinarians")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({
          email,
          firstname: "Nouveau",
          lastname: "Veto",
          licenseNumber: "VET-998",
        });

      expect(res.status).toBe(201);
      expect(res.body).not.toHaveProperty("password");
    });

    it("un mot de passe envoyé dans le body est ignoré (mdp généré côté serveur)", async () => {
      const res = await request(app)
        .post("/api/referent/staff/veterinarians")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({
          email,
          firstname: "Nouveau",
          lastname: "Veto",
          licenseNumber: "VET-997",
          password: "JeVeuxCeMotDePasse1!",
        });
      expect(res.status).toBe(201);

      const login = await request(app).post("/api/auth/login").send({
        email,
        password: "JeVeuxCeMotDePasse1!",
      });
      expect(login.status).toBe(401);
    });

    it("409 — numéro de licence déjà utilisé", async () => {
      const res = await request(app)
        .post("/api/referent/staff/veterinarians")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({
          email,
          firstname: "Nouveau",
          lastname: "Veto",
          licenseNumber: "VET-002",
        });
      expect(res.status).toBe(409);
    });

    it("403 — un vétérinaire n'a pas le droit d'appeler cette route", async () => {
      const login = await request(app).post("/api/auth/login").send({
        email: "veto@gmail.com",
        password: "Password123!",
      });
      const res = await request(app)
        .post("/api/referent/staff/veterinarians")
        .set("Authorization", `Bearer ${login.body.accessToken}`)
        .send({
          email,
          firstname: "Nouveau",
          lastname: "Veto",
          licenseNumber: "VET-996",
        });
      expect(res.status).toBe(403);
    });
  });

  // -----------------------------------------------------------------
  describe("GET /search & POST /link — vétérinaire existant", () => {
    const email = "veto-a-lier-referent@test.com";
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
            create: { licenseNumber: "VET-LIBRE-REF-001" },
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
        .get("/api/referent/staff/veterinarians/search?q=VET-LIBRE-REF-001")
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(vetId);
    });

    it("201 — lie le vétérinaire trouvé à la clinique", async () => {
      const res = await request(app)
        .post("/api/referent/staff/veterinarians/link")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ veterinarianId: vetId });
      expect(res.status).toBe(201);

      const link = await getPrisma().veterinarianClinic.findFirst({
        where: { veterinarianId: vetId, clinicId: referentClinicId },
      });
      expect(link).not.toBeNull();
    });

    it("409 — lier deux fois le même vétérinaire", async () => {
      await request(app)
        .post("/api/referent/staff/veterinarians/link")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ veterinarianId: vetId });

      const res = await request(app)
        .post("/api/referent/staff/veterinarians/link")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ veterinarianId: vetId });
      expect(res.status).toBe(409);
    });

    it("404 — lier un id de vétérinaire inexistant", async () => {
      const res = await request(app)
        .post("/api/referent/staff/veterinarians/link")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ veterinarianId: "00000000-0000-0000-0000-000000000000" });
      expect(res.status).toBe(404);
    });

    it("401 — sans token", async () => {
      const res = await request(app)
        .get("/api/referent/staff/veterinarians/search?q=VET-LIBRE-REF-001")
        .send();
      expect(res.status).toBe(401);
    });
  });

  // -----------------------------------------------------------------
  describe("PATCH /api/referent/clinic", () => {
    it("401 — sans token", async () => {
      const res = await request(app)
        .patch("/api/referent/clinic")
        .send({ name: "Nouveau nom" });
      expect(res.status).toBe(401);
    });

    it("200 — modifie le nom, téléphone, site web, description et adresse", async () => {
      const res = await request(app)
        .patch("/api/referent/clinic")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({
          name: "Clinique renommée",
          phone: "0198765432",
          website: "https://renommee.fr",
          description: "Nouvelle description",
          street: "9 avenue Renommée",
          postalCode: "75002",
          city: "Paris",
        });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Clinique renommée");
      expect(res.body.phone).toBe("0198765432");
      expect(res.body.website).toBe("https://renommee.fr");
      expect(res.body.description).toBe("Nouvelle description");
      expect(res.body.street).toBe("9 avenue Renommée");

      const updated = await getPrisma().clinic.findUnique({
        where: { id: referentClinicId },
      });
      expect(updated!.name).toBe("Clinique renommée");
    });

    it("400 — refuse un SIRET dans le corps (champ non autorisé pour le référent)", async () => {
      const res = await request(app)
        .patch("/api/referent/clinic")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ siret: "11111111111111" });
      // Le champ est silencieusement ignoré (schema strip), le SIRET ne doit pas changer.
      expect(res.status).toBe(200);
      const clinic = await getPrisma().clinic.findUnique({
        where: { id: referentClinicId },
      });
      expect(clinic!.siret).toBe(clinicSiret);
    });
  });
});
