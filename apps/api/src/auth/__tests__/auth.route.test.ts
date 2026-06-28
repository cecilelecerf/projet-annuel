import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import request from "supertest";
import { getPrisma } from "../../../__tests__/setup";
import { app } from "@api/app";

// -------------------------------------------------------------------
describe("POST /api/auth/register", () => {
  beforeEach(async () => {
    await getPrisma().refreshToken.deleteMany({
      where: { user: { email: "nouveau@test.com" } },
    });
    await getPrisma().user.deleteMany({
      where: { email: "nouveau@test.com" },
    });
  });
  it("201 — crée un utilisateur", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "nouveau@test.com",
      password: "Password1!",
      firstname: "Alice",
      lastname: "Dupont",
    });
    expect(res.status).toBe(201);
    expect(res.body.user).not.toHaveProperty("password");

    const user = await getPrisma().user.findUnique({
      where: { email: "nouveau@test.com" },
    });
    expect(user).not.toBeNull();
    expect(user!.password).not.toBe("Password1!");
  });

  it("409 — email déjà utilisé", async () => {
    // Crée l'utilisateur une première fois
    await request(app).post("/api/auth/register").send({
      email: "nouveau@test.com",
      password: "Password1!",
      firstname: "Alice",
      lastname: "Dupont",
    });

    // Retente avec le même email
    const res = await request(app).post("/api/auth/register").send({
      email: "nouveau@test.com",
      password: "Password1!",
      firstname: "Alice",
      lastname: "Dupont",
    });

    expect(res.status).toBe(409);
  });

  it("400 — body invalide", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email" });

    expect(res.status).toBe(400);
  });
});

// -------------------------------------------------------------------
describe("POST /api/auth/login", () => {
  it("200 — login réussi", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "veto@gmail.com",
      password: "Password123!",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.user).toHaveProperty("clinicId");
    expect(res.body.user).toHaveProperty("email");
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("401 — mauvais mot de passe", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "veto@gmail.com",
      password: "WrongPassword1!",
    });

    expect(res.status).toBe(401);
  });

  it("401 — utilisateur introuvable", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "ghost@test.com",
      password: "Password1!",
    });

    expect(res.status).toBe(401);
  });
});

// -------------------------------------------------------------------
describe("GET /api/auth/me", () => {
  it("200 — retourne l'utilisateur connecté", async () => {
    // Register + login pour avoir un token réel

    const login = await request(app).post("/api/auth/login").send({
      email: "veto@gmail.com",
      password: "Password123!",
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("email", "veto@gmail.com");
    expect(res.body).not.toHaveProperty("password");
  });

  it("401 — sans token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("204 — logout réussi", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: "veto@gmail.com",
      password: "Password123!",
    });

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${login.body.accessToken}`)
      .send({
        refreshToken: login.body.refreshToken,
      });
    expect(res.status).toBe(204);

    const token = await getPrisma().refreshToken.findUnique({
      where: { token: login.body.refreshToken },
    });
    expect(token).toBeNull();
  });
});

// -------------------------------------------------------------------
describe("POST /api/auth/register-director", () => {
  const directorEmail = "nouveau-directeur@test.com";
  const siret = "98765432109876";

  const validPayload = {
    email: directorEmail,
    password: "Password1!",
    firstname: "Jean",
    lastname: "Directeur",
    clinic: {
      name: "Clinique Vétérinaire du Centre",
      address: "12 rue de la Paix, 75001 Paris",
      siret,
      phone: "0102030405",
      website: "https://clinique-centre.fr",
    },
  };

  beforeEach(async () => {
    await getPrisma().clinicAct.deleteMany({ where: { clinic: { siret } } });
    await getPrisma().clinicCreationRequest.deleteMany({ where: { siret } });
    await getPrisma().refreshToken.deleteMany({
      where: { user: { email: directorEmail } },
    });
    await getPrisma().user.deleteMany({ where: { email: directorEmail } });
    await getPrisma().clinic.deleteMany({ where: { siret } });
  });

  it("201 — crée un directeur avec sa demande de clinique", async () => {
    const res = await request(app)
      .post("/api/auth/register-director")
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.user).not.toHaveProperty("password");

    const request_ = await getPrisma().clinicCreationRequest.findFirst({
      where: { siret },
    });
    expect(request_).not.toBeNull();
    expect(request_!.status).toBe("PENDING");
  });

  it("400 — clinic manquante", async () => {
    const res = await request(app).post("/api/auth/register-director").send({
      email: directorEmail,
      password: "Password1!",
      firstname: "Jean",
      lastname: "Directeur",
    });
    expect(res.status).toBe(400);
  });

  it("400 — siret invalide (pas 14 chiffres)", async () => {
    const res = await request(app)
      .post("/api/auth/register-director")
      .send({
        ...validPayload,
        clinic: { ...validPayload.clinic, siret: "123" },
      });
    expect(res.status).toBe(400);
  });

  it("409 — email déjà utilisé", async () => {
    await request(app).post("/api/auth/register-director").send(validPayload);

    const res = await request(app)
      .post("/api/auth/register-director")
      .send(validPayload);

    expect(res.status).toBe(409);
  });

  it("409 — siret déjà utilisé par une clinique existante", async () => {
    await getPrisma().clinic.create({
      data: {
        name: "Clinique existante",
        address: "1 rue Test",
        siret,
        phone: "0102030405",
        website: "https://existant.fr",
        description: null,
        openingHours: "09:00",
      },
    });

    const res = await request(app)
      .post("/api/auth/register-director")
      .send(validPayload);

    expect(res.status).toBe(409);
  });
});

// -------------------------------------------------------------------
describe("POST /api/auth/refresh", () => {
  afterEach(async () => {
    await getPrisma().refreshToken.deleteMany({
      where: { user: { email: "veto@gmail.com" } },
    });
  });

  it("200 — renouvelle les tokens", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: "veto@gmail.com",
      password: "Password123!",
    });
    expect(login.status).toBe(200);

    const oldRefreshToken = login.body.refreshToken;

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: oldRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body.refreshToken).not.toBe(oldRefreshToken);

    const oldToken = await getPrisma().refreshToken.findUnique({
      where: { token: oldRefreshToken },
    });
    expect(oldToken).toBeNull();

    const newToken = await getPrisma().refreshToken.findUnique({
      where: { token: res.body.refreshToken },
    });
    expect(newToken).not.toBeNull();
  });

  it("401 — refresh token invalide", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "ce-token-n-existe-pas" });

    expect(res.status).toBe(401);
  });

  it("401 — refresh token expiré", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: "veto@gmail.com",
      password: "Password123!",
    });

    await getPrisma().refreshToken.update({
      where: { token: login.body.refreshToken },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: login.body.refreshToken });

    expect(res.status).toBe(401);

    const expiredToken = await getPrisma().refreshToken.findUnique({
      where: { token: login.body.refreshToken },
    });
    expect(expiredToken).toBeNull();
  });
});

// -------------------------------------------------------------------
describe("Suppression de compte", () => {
  const deleteEmail = "a-supprimer@test.com";
  let accessToken: string;

  beforeEach(async () => {
    await getPrisma().otpCode.deleteMany({
      where: { user: { email: deleteEmail } },
    });
    await getPrisma().refreshToken.deleteMany({
      where: { user: { email: deleteEmail } },
    });
    await getPrisma().user.deleteMany({ where: { email: deleteEmail } });

    await request(app).post("/api/auth/register").send({
      email: deleteEmail,
      password: "Password1!",
      firstname: "Test",
      lastname: "Suppression",
    });

    const login = await request(app).post("/api/auth/login").send({
      email: deleteEmail,
      password: "Password1!",
    });
    accessToken = login.body.accessToken;
  });

  describe("POST /api/auth/delete-account/request", () => {
    it("200 — envoie le code OTP", async () => {
      const res = await request(app)
        .post("/api/auth/delete-account/request")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");

      const otp = await getPrisma().otpCode.findFirst({
        where: { user: { email: deleteEmail }, action: "DELETE_ACCOUNT" },
      });
      expect(otp).not.toBeNull();
    });

    it("401 — sans token", async () => {
      const res = await request(app).post("/api/auth/delete-account/request");
      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /api/auth/delete-account", () => {
    it("204 — supprime le compte avec code valide", async () => {
      await request(app)
        .post("/api/auth/delete-account/request")
        .set("Authorization", `Bearer ${accessToken}`);

      const otp = await getPrisma().otpCode.findFirst({
        where: { user: { email: deleteEmail }, action: "DELETE_ACCOUNT" },
      });

      const res = await request(app)
        .delete("/api/auth/delete-account")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ code: otp!.code });

      expect(res.status).toBe(204);

      const user = await getPrisma().user.findUnique({
        where: { email: deleteEmail },
      });
      expect(user).toBeNull();
    });

    it("401 — code invalide", async () => {
      await request(app)
        .post("/api/auth/delete-account/request")
        .set("Authorization", `Bearer ${accessToken}`);

      const res = await request(app)
        .delete("/api/auth/delete-account")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ code: "000000" });

      expect(res.status).toBe(401);
    });

    it("400 — code manquant", async () => {
      const res = await request(app)
        .delete("/api/auth/delete-account")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("401 — sans token", async () => {
      const res = await request(app)
        .delete("/api/auth/delete-account")
        .send({ code: "123456" });

      expect(res.status).toBe(401);
    });
  });
});
