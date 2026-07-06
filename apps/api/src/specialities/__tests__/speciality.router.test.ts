import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { hash } from "bcryptjs";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
// Ajuste selon l'emplacement réel de ce fichier de test
import { getPrisma } from "../../../__tests__/setup";

// ── Helpers ──────────────────────────────────────────────────────────────────

const DISPOSABLE_PASSWORD = "Password123!";

async function createUnapprovedDirector() {
  const prisma = getPrisma();
  const email = `disposable-director-${randomUUID()}@test.com`;
  const password = await hash(DISPOSABLE_PASSWORD, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password,
      firstname: "Test",
      lastname: "Jetable",
      role: "DIRECTOR",
    },
  });
  await prisma.directorClinicProfile.create({ data: { id: user.id } });

  return { userId: user.id, email };
}

async function cleanupDisposableDirector(email: string) {
  const prisma = getPrisma();
  await prisma.refreshToken.deleteMany({ where: { user: { email } } });
  await prisma.user.deleteMany({ where: { email } });
}

async function createDisposableSpeciality() {
  const prisma = getPrisma();
  return prisma.speciality.create({
    data: {
      name: `Spécialité Test ${randomUUID().slice(0, 8)}`,
      description: "Description de test",
    },
  });
}

async function cleanupSpecialityByName(name: string) {
  await getPrisma().speciality.deleteMany({ where: { name } });
}

// ── GET /api/specialities ────────────────────────────────────────────────────

describe("GET /api/specialities", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/specialities");
    expect(res.status).toBe(401);
  });

  it("403 — DIRECTOR non approuvé (requireApprovedClinic global)", async () => {
    const { email } = await createUnapprovedDirector();
    try {
      const token = await loginAs(email);
      const res = await request(app)
        .get("/api/specialities")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    } finally {
      await cleanupDisposableDirector(email);
    }
  });

  it("200 — n'importe quel rôle approuvé/non-directeur peut lister", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get("/api/specialities")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("200 — filtre par recherche (search)", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get("/api/specialities")
      .query({ search: "cardio" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── GET /api/specialities/:id ────────────────────────────────────────────────

describe("GET /api/specialities/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get(`/api/specialities/${randomUUID()}`);
    expect(res.status).toBe(401);
  });

  it("403 — rôle non-ADMIN", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get(`/api/specialities/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("404 — spécialité introuvable", async () => {
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .get(`/api/specialities/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("200 — ADMIN récupère une spécialité par id", async () => {
    const speciality = await createDisposableSpeciality();
    try {
      const token = await loginAs("admin@gmail.com");
      const res = await request(app)
        .get(`/api/specialities/${speciality.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id", speciality.id);
    } finally {
      await cleanupSpecialityByName(speciality.name);
    }
  });
});

// ── POST /api/specialities ───────────────────────────────────────────────────

describe("POST /api/specialities", () => {
  it("401 — sans token", async () => {
    const res = await request(app)
      .post("/api/specialities")
      .send({ name: "X", description: "Y" });
    expect(res.status).toBe(401);
  });

  it("403 — rôle non-ADMIN", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .post("/api/specialities")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "X", description: "Y" });
    expect(res.status).toBe(403);
  });

  it("400 — description manquante", async () => {
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .post("/api/specialities")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: `Spécialité Test ${randomUUID().slice(0, 8)}` });

    expect(res.status).toBe(400);
  });

  it("201 — crée une nouvelle spécialité", async () => {
    const name = `Spécialité Test ${randomUUID().slice(0, 8)}`;
    try {
      const token = await loginAs("admin@gmail.com");
      const res = await request(app)
        .post("/api/specialities")
        .set("Authorization", `Bearer ${token}`)
        .send({ name, description: "Une description" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("name", name);
    } finally {
      await cleanupSpecialityByName(name);
    }
  });

  it("201 — un nom déjà existant renvoie la spécialité existante (pas de doublon)", async () => {
    const name = `Spécialité Test ${randomUUID().slice(0, 8)}`;
    try {
      const token = await loginAs("admin@gmail.com");

      const first = await request(app)
        .post("/api/specialities")
        .set("Authorization", `Bearer ${token}`)
        .send({ name, description: "Une description" });

      const second = await request(app)
        .post("/api/specialities")
        .set("Authorization", `Bearer ${token}`)
        .send({ name, description: "Une autre description" });

      expect(second.status).toBe(201);
      expect(second.body.id).toBe(first.body.id);

      const count = await getPrisma().speciality.count({ where: { name } });
      expect(count).toBe(1);
    } finally {
      await cleanupSpecialityByName(name);
    }
  });
});

// ── PATCH /api/specialities/:id ──────────────────────────────────────────────

describe("PATCH /api/specialities/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app)
      .patch(`/api/specialities/${randomUUID()}`)
      .send({ description: "Nouvelle description" });
    expect(res.status).toBe(401);
  });

  it("403 — rôle non-ADMIN", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .patch(`/api/specialities/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Nouvelle description" });
    expect(res.status).toBe(403);
  });

  it("404 — spécialité introuvable", async () => {
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .patch(`/api/specialities/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Nouvelle description" });
    expect(res.status).toBe(404);
  });

  it("200 — ADMIN met à jour une spécialité", async () => {
    const speciality = await createDisposableSpeciality();
    try {
      const token = await loginAs("admin@gmail.com");
      const res = await request(app)
        .patch(`/api/specialities/${speciality.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ description: "Description mise à jour" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("description", "Description mise à jour");
    } finally {
      await cleanupSpecialityByName(speciality.name);
    }
  });
});

// ── DELETE /api/specialities/:id ─────────────────────────────────────────────

describe("DELETE /api/specialities/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).delete(`/api/specialities/${randomUUID()}`);
    expect(res.status).toBe(401);
  });

  it("403 — rôle non-ADMIN", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .delete(`/api/specialities/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("404 — spécialité introuvable", async () => {
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .delete(`/api/specialities/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("204 — ADMIN supprime une spécialité", async () => {
    const speciality = await createDisposableSpeciality();
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .delete(`/api/specialities/${speciality.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);

    const deleted = await getPrisma().speciality.findUnique({
      where: { id: speciality.id },
    });
    expect(deleted).toBeNull();
  });
});
