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

    // Vérifie que l'utilisateur est bien en DB
    const user = await getPrisma().user.findUnique({
      where: { email: "nouveau@test.com" },
    });
    expect(user).not.toBeNull();
    expect(user!.password).not.toBe("Password1!"); // hashé
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

// -------------------------------------------------------------------
describe("POST /api/auth/logout", () => {
  it("204 — logout réussi", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: "veto@gmail.com",
      password: "Password123!",
    });

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${login.body.accessToken}`)
      .send({ refreshToken: login.body.refreshToken });

    expect(res.status).toBe(204);

    // Vérifie que le refreshToken est bien supprimé
    const token = await getPrisma().refreshToken.findFirst();
    expect(token).toBeNull();
  });
});
