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
// ── GET /api/users ─────────────────────────────────────────────────────────────

describe("GET /api/users", () => {
  describe("auth & role guards", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/users");
      expect(res.status).toBe(401);
    });

    it("403 — rôle CLIENT non autorisé", async () => {
      const token = await loginAs("client@gmail.com");
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it("403 — rôle VETERINARIAN non autorisé", async () => {
      const token = await loginAs("veto@gmail.com");
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it("403 — rôle SECRETARY non autorisé", async () => {
      const token = await loginAs("secretaire@gmail.com");
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  describe("ADMIN", () => {
    it("200 — retourne tous les utilisateurs", async () => {
      const token = await loginAs("admin@gmail.com");
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it("ne retourne pas les mots de passe", async () => {
      const token = await loginAs("admin@gmail.com");
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      res.body.forEach((user) => {
        expect(user).not.toHaveProperty("password");
      });
    });
  });

  describe("DIRECTOR", () => {
    it("200 — retourne les utilisateurs de la clinique", async () => {
      const token = await loginAs("directeur@gmail.com");
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it("ne retourne pas les utilisateurs d'autres cliniques", async () => {
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

      const usersOutsideClinic = await getPrisma().user.findMany({
        where: {
          AND: [
            { veterinarianProfile: null },
            { secretaryProfile: { clinicId: { not: clinicId } } },
          ],
        },
        select: { id: true },
      });
      const outsideIds = new Set(usersOutsideClinic.map((u) => u.id));

      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      res.body.forEach((user) => {
        expect(outsideIds.has(user.id)).toBe(false);
      });
    });
  });

  describe("REFERENT", () => {
    it("200 — retourne les utilisateurs de la clinique", async () => {
      const token = await loginAs("referent@gmail.com");
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });
});

// ── GET /api/users/roles/:role ─────────────────────────────────────────────────

describe("GET /api/users/roles/:role", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/users/roles/veterinarian");
    expect(res.status).toBe(401);
  });

  it("403 — rôle CLIENT non autorisé", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get("/api/users/roles/veterinarian")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("400 — rôle invalide", async () => {
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .get("/api/users/roles/INVALID_ROLE")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("200 — ADMIN retourne les vétérinaires", async () => {
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .get("/api/users/roles/veterinarian")
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
      .get("/api/users/roles/client")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    res.body.forEach((user) => {
      expect(user.role).toBe("CLIENT");
    });
  });

  it("200 — DIRECTOR retourne les vétérinaires de sa clinique", async () => {
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

    const vetosInClinic = await getPrisma().user.findMany({
      where: {
        veterinarianProfile: {
          veterinarianClinics: { some: { clinicId } },
        },
      },
      select: { id: true },
    });
    const vetoIds = new Set(vetosInClinic.map((u) => u.id));

    const res = await request(app)
      .get("/api/users/roles/veterinarian")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.forEach((user) => {
      expect(vetoIds.has(user.id)).toBe(true);
    });
  });

  it("200 — SECRETARY retourne les vétérinaires de sa clinique", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const secretary = await getPrisma().user.findUnique({
      where: { email: "secretaire@gmail.com" },
      select: {
        secretaryProfile: {
          select: {
            clinic: {
              select: {
                veterinarianClinics: { select: { veterinarianId: true } },
              },
            },
          },
        },
      },
    });
    const vetoIds = secretary?.secretaryProfile?.clinic.veterinarianClinics.map(
      (veto) => veto.veterinarianId,
    );

    const res = await request(app)
      .get("/api/users/roles/veterinarian")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.forEach((user) => {
      expect(vetoIds!.includes(user.id)).toBe(true);
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
