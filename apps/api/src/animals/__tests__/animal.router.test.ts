import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { getPrisma } from "../../../__tests__/setup";

const loginAs = async (email: string, password = "Password123!") => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res.body.accessToken as string;
};

// ── GET /api/animals ──────────────────────────────────────────────────────────

describe("GET /api/animals", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/animals");
    expect(res.status).toBe(401);
  });

  it("200 — STAFF retourne tous les animaux", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .get("/api/animals")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("200 — CLIENT retourne uniquement ses animaux", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get("/api/animals")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── GET /api/animals/:id ──────────────────────────────────────────────────────

describe("GET /api/animals/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/animals/some-id");
    expect(res.status).toBe(401);
  });

  it("404 — animal introuvable", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .get("/api/animals/non-existent-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("403 — CLIENT accède à l'animal d'un autre client", async () => {
    const token = await loginAs("client@gmail.com");

    const client = await getPrisma().user.findUnique({
      where: { email: "client@gmail.com" },
      include: { clientProfile: true },
    });

    const otherAnimal = await getPrisma().animal.findFirst({
      where: { clientId: { not: client!.clientProfile!.id } },
    });

    const res = await request(app)
      .get(`/api/animals/${otherAnimal!.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("200 — CLIENT accède à son propre animal", async () => {
    const token = await loginAs("client@gmail.com");

    const client = await getPrisma().user.findUnique({
      where: { email: "client@gmail.com" },
      include: { clientProfile: true },
    });

    const animal = await getPrisma().animal.findFirst({
      where: { clientId: client!.clientProfile!.id },
    });

    const res = await request(app)
      .get(`/api/animals/${animal!.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", animal!.id);
  });

  it("200 — STAFF accède à n'importe quel animal", async () => {
    const token = await loginAs("veto@gmail.com");
    const animal = await getPrisma().animal.findFirst();

    const res = await request(app)
      .get(`/api/animals/${animal!.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", animal!.id);
  });
});

// ── GET /api/animals/:id/vaccines ─────────────────────────────────────────────

describe("GET /api/animals/:id/vaccines", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/animals/some-id/vaccines");
    expect(res.status).toBe(401);
  });

  it("404 — animal introuvable", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .get("/api/animals/non-existent-id/vaccines")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("200 — retourne les vaccins de l'animal", async () => {
    const token = await loginAs("veto@gmail.com");
    const animal = await getPrisma().animal.findFirst();

    const res = await request(app)
      .get(`/api/animals/${animal!.id}/vaccines`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── POST /api/animals ─────────────────────────────────────────────────────────

describe("POST /api/animals", () => {
  it("401 — sans token", async () => {
    const res = await request(app).post("/api/animals");
    expect(res.status).toBe(401);
  });

  it("400 — body invalide", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .post("/api/animals")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });
  it("201 — CLIENT ne peut pas usurper un clientId", async () => {
    const token = await loginAs("client@gmail.com");
    const race = await getPrisma().race.findFirst();
    const client = await getPrisma().user.findUnique({
      where: { email: "client@gmail.com" },
    });
    const otherClient = await getPrisma().user.findFirst({
      where: { role: "CLIENT", email: { not: "client@gmail.com" } },
    });

    const res = await request(app)
      .post("/api/animals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Rex",
        dateOfBirth: "2022-01-01",
        raceId: race!.id,
        outdoorAccess: false,
        animalContact: false,
        clientId: otherClient!.id,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("clientId", client!.id);
  });

  it("201 — CLIENT crée son animal", async () => {
    const token = await loginAs("client@gmail.com");
    const race = await getPrisma().race.findFirst();

    const res = await request(app)
      .post("/api/animals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Rex",
        dateOfBirth: "2022-01-01",
        raceId: race!.id,
        outdoorAccess: false,
        animalContact: false,
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });

  it("201 — STAFF crée un animal pour un client", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const race = await getPrisma().race.findFirst();
    const client = await getPrisma().user.findFirst({
      where: { role: "CLIENT" },
    });

    const res = await request(app)
      .post("/api/animals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Luna",
        dateOfBirth: "2021-06-15",
        raceId: race!.id,
        clientId: client!.id,

        outdoorAccess: false,
        animalContact: false,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });
});

// ── PATCH /api/animals/:id ────────────────────────────────────────────────────

describe("PATCH /api/animals/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).patch("/api/animals/some-id");
    expect(res.status).toBe(401);
  });

  it("404 — animal introuvable", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .patch("/api/animals/non-existent-id")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Nouveau nom" });
    expect(res.status).toBe(404);
  });

  it("403 — CLIENT modifie l'animal d'un autre client", async () => {
    const token = await loginAs("client@gmail.com");
    const client = await getPrisma().user.findUnique({
      where: { email: "client@gmail.com" },
      include: { clientProfile: true },
    });
    const otherAnimal = await getPrisma().animal.findFirst({
      where: { clientId: { not: client!.clientProfile!.id } },
    });

    const res = await request(app)
      .patch(`/api/animals/${otherAnimal!.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Nouveau nom" });
    expect(res.status).toBe(403);
  });

  it("200 — CLIENT modifie son propre animal", async () => {
    const token = await loginAs("client@gmail.com");
    const client = await getPrisma().user.findUnique({
      where: { email: "client@gmail.com" },
      include: { clientProfile: true },
    });
    const animal = await getPrisma().animal.findFirst({
      where: { clientId: client!.clientProfile!.id },
    });

    const res = await request(app)
      .patch(`/api/animals/${animal!.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Nouveau nom" });
    expect(res.status).toBe(200);
  });

  it("200 — STAFF modifie n'importe quel animal", async () => {
    const token = await loginAs("veto@gmail.com");
    const animal = await getPrisma().animal.findFirst();

    const res = await request(app)
      .patch(`/api/animals/${animal!.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Modifié par staff" });
    expect(res.status).toBe(200);
  });
});

// ── DELETE /api/animals/:id ───────────────────────────────────────────────────

describe("DELETE /api/animals/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).delete("/api/animals/some-id");
    expect(res.status).toBe(401);
  });

  it("404 — animal introuvable", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .delete("/api/animals/non-existent-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("403 — CLIENT supprime l'animal d'un autre client", async () => {
    const token = await loginAs("client@gmail.com");
    const client = await getPrisma().user.findUnique({
      where: { email: "client@gmail.com" },
      include: { clientProfile: true },
    });
    const otherAnimal = await getPrisma().animal.findFirst({
      where: { clientId: { not: client!.clientProfile!.id } },
    });

    const res = await request(app)
      .delete(`/api/animals/${otherAnimal!.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("204 — CLIENT supprime son propre animal", async () => {
    const token = await loginAs("client@gmail.com");
    const race = await getPrisma().race.findFirst();
    await getPrisma().user.findUnique({
      where: { email: "client@gmail.com" },
      include: { clientProfile: true },
    });

    const created = await request(app)
      .post("/api/animals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "À supprimer",
        dateOfBirth: "2020-01-01",
        raceId: race!.id,
        outdoorAccess: false,
        animalContact: false,
      });
    const res = await request(app)
      .delete(`/api/animals/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it("403 — STAFF ne peut pas supprimer un animal", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const animal = await getPrisma().animal.findFirst();

    const res = await request(app)
      .delete(`/api/animals/${animal!.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
