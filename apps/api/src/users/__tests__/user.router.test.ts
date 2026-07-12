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

// ── GET /api/users?role=:role ─────────────────────────────────────────────────

describe("GET /api/users?role=:role", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/users?role=veterinarian");
    expect(res.status).toBe(401);
  });

  it("403 — rôle CLIENT non autorisé", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get("/api/users?role=veterinarian")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("400 — rôle invalide", async () => {
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .get("/api/users?role=INVALID_ROLE")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("200 — ADMIN retourne les vétérinaires", async () => {
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .get("/api/users?role=veterinarian")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    res.body.forEach((user) => {
      expect(user.role).toBe("VETERINARIAN");
    });
  });

  it("200 — ADMIN retourne les clients", async () => {
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .get("/api/users?role=client")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    res.body.forEach((user) => {
      expect(user.role).toBe("CLIENT");
    });
  });
});

// ── GET /api/users/:id ─────────────────────────────────────────────────────────

describe("GET /api/users/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/users/some-id");
    expect(res.status).toBe(401);
  });

  it("403 — CLIENT essaie d'accéder à un ADMIN", async () => {
    const admin = await getPrisma().user.findFirst({
      where: { role: "ADMIN" },
    });
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get(`/api/users/${admin!.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("404 — utilisateur introuvable", async () => {
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .get("/api/users/non-existent-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("200 — ADMIN retourne n'importe quel utilisateur", async () => {
    const token = await loginAs("admin@gmail.com");
    const target = await getPrisma().user.findUnique({
      where: { email: "veto@gmail.com" },
    });

    const res = await request(app)
      .get(`/api/users/${target!.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("email", "veto@gmail.com");
    expect(res.body).not.toHaveProperty("password");
  });

  it("200 — SECRETARY retourne un utilisateur de sa clinique", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const veto = await getPrisma().user.findUnique({
      where: { email: "veto@gmail.com" },
    });

    const res = await request(app)
      .get(`/api/users/${veto!.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("password");
  });

  it("200 — DIRECTOR retourne un utilisateur de sa clinique", async () => {
    const token = await loginAs("directeur@gmail.com");
    const veto = await getPrisma().user.findUnique({
      where: { email: "veto@gmail.com" },
    });

    const res = await request(app)
      .get(`/api/users/${veto!.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("password");
  });

  it("403 — DIRECTOR ne peut pas accéder à un utilisateur d'une autre clinique", async () => {
    const token = await loginAs("directeur@gmail.com");
    const director = await getPrisma().user.findUnique({
      where: { email: "directeur@gmail.com" },
      select: {
        directorClinicProfile: {
          select: { clinic: { select: { id: true } } },
        },
      },
    });
    const clinicId = director!.directorClinicProfile!.clinic!.id;

    const otherClinicVeto = await getPrisma().user.findFirst({
      where: {
        veterinarianProfile: {
          veterinarianClinics: {
            none: { clinicId },
          },
        },
      },
    });

    const res = await request(app)
      .get(`/api/users/${otherClinicVeto!.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("200 — STAFF peut accéder à un CLIENT", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const client = await getPrisma().user.findUnique({
      where: { email: "client@gmail.com" },
    });

    const res = await request(app)
      .get(`/api/users/${client!.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("password");
  });
});

// ── GET /api/users/:id/animal ─────────────────────────────────────────────

describe("GET /api/users/:id/animals", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/users/some-id/animals");
    expect(res.status).toBe(401);
  });

  it("403 — CLIENT accède aux animaux d'un autre client", async () => {
    const token = await loginAs("client@gmail.com");

    const otherClient = await getPrisma().user.findFirst({
      where: {
        email: { not: "client@gmail.com" },
        role: "CLIENT",
      },
    });

    const res = await request(app)
      .get(`/api/users/${otherClient!.id}/animals`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("200 — CLIENT accède à ses propres animaux", async () => {
    const token = await loginAs("client@gmail.com");
    const client = await getPrisma().user.findUnique({
      where: { email: "client@gmail.com" },
    });

    const res = await request(app)
      .get(`/api/users/${client!.id}/animals`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("200 — STAFF accède aux animaux d'un client", async () => {
    const token = await loginAs("veto@gmail.com");
    const client = await getPrisma().user.findFirst({
      where: { role: "CLIENT" },
    });

    const res = await request(app)
      .get(`/api/users/${client!.id}/animals`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
