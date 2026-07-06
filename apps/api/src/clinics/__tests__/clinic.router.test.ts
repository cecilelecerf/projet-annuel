import { describe, it, expect, afterEach } from "vitest";
import { randomUUID } from "crypto";
import { hash } from "bcryptjs";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
import { getPrisma } from "../../../__tests__/setup";

// ── Helpers ──────────────────────────────────────────────────────────────────
// Crée un directeur + une clinique jetables (sans aucune dépendance), pour
// tester la suppression sans risquer de casser les données seedées utilisées
// par les autres suites de tests.

const DISPOSABLE_PASSWORD = "Password123!";

async function createDisposableDirectorWithClinic() {
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

  const clinic = await prisma.clinic.create({
    data: {
      name: "Clinique jetable",
      address: "1 rue du Test",
      siret: `9${Date.now()}`.slice(0, 14),
      phone: "0102030405",
      website: "https://jetable.fr",
      lat: 0,
      lng: 0,
      directorId: user.id,
    },
  });

  return { userId: user.id, email, clinicId: clinic.id };
}

async function cleanupDisposable(email: string) {
  const prisma = getPrisma();
  await prisma.refreshToken.deleteMany({ where: { user: { email } } });
  // Cascade automatiquement vers DirectorClinicProfile ; la Clinic doit être
  // supprimée avant (FK obligatoire Clinic.directorId), donc on essaie sa
  // suppression seulement si elle existe encore (le test de suppression aura
  // déjà pu la supprimer lui-même).
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.clinic.deleteMany({ where: { directorId: user.id } });
  }
  await prisma.user.deleteMany({ where: { email } });
}

// ── GET /api/clinics/ ──────────────────────────────────────────────────────────

describe("GET /api/clinics/", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/clinics/");
    expect(res.status).toBe(401);
  });

  it("403 — rôle DIRECTOR non autorisé", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .get("/api/clinics/")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("200 — ADMIN retourne toutes les cliniques", async () => {
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .get("/api/clinics/")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

// ── GET /api/clinics/:id/medical-histories ────────────────────────────────────

describe("GET /api/clinics/:id/medical-histories", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get(
      "/api/clinics/some-id/medical-histories",
    );
    expect(res.status).toBe(401);
  });

  it("200 — VETERINARIAN retourne l'historique de sa clinique", async () => {
    const token = await loginAs("veto@gmail.com");
    const clinic = await getPrisma().clinic.findFirst();

    const res = await request(app)
      .get(`/api/clinics/${clinic!.id}/medical-histories`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── GET /api/clinics/:id/specialities ──────────────────────────────────────────

describe("GET /api/clinics/:id/specialities", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/clinics/some-id/specialities");
    expect(res.status).toBe(401);
  });

  it("200 — retourne les spécialités de la clinique (aucun rôle restreint)", async () => {
    const token = await loginAs("veto@gmail.com");
    const clinic = await getPrisma().clinic.findFirst();

    const res = await request(app)
      .get(`/api/clinics/${clinic!.id}/specialities`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── PATCH /api/clinics/:id/specialities ────────────────────────────────────────

describe("PATCH /api/clinics/:id/specialities", () => {
  it("401 — sans token", async () => {
    const res = await request(app)
      .patch("/api/clinics/some-id/specialities")
      .send({ specialityIds: [] });
    expect(res.status).toBe(401);
  });

  it("403 — rôle VETERINARIAN non autorisé", async () => {
    const token = await loginAs("veto@gmail.com");
    const clinic = await getPrisma().clinic.findFirst();

    const res = await request(app)
      .patch(`/api/clinics/${clinic!.id}/specialities`)
      .set("Authorization", `Bearer ${token}`)
      .send({ specialityIds: [] });

    expect(res.status).toBe(403);
  });

  it("400 — body invalide", async () => {
    const token = await loginAs("directeur@gmail.com");
    const clinic = await getPrisma().clinic.findFirst({
      where: { director: { user: { email: "directeur@gmail.com" } } },
    });

    const res = await request(app)
      .patch(`/api/clinics/${clinic!.id}/specialities`)
      .set("Authorization", `Bearer ${token}`)
      .send({ specialityIds: "not-an-array" });

    expect(res.status).toBe(400);
  });

  it("200 — DIRECTOR met à jour les spécialités de sa clinique", async () => {
    const token = await loginAs("directeur@gmail.com");
    const clinic = await getPrisma().clinic.findFirst({
      where: { director: { user: { email: "directeur@gmail.com" } } },
    });
    const specialities = await getPrisma().speciality.findMany({ take: 2 });

    const res = await request(app)
      .patch(`/api/clinics/${clinic!.id}/specialities`)
      .set("Authorization", `Bearer ${token}`)
      .send({ specialityIds: specialities.map((s) => s.id) });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── GET /api/clinics/:id/staffs ────────────────────────────────────────────────

describe("GET /api/clinics/:id/staffs", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/clinics/some-id/staffs");
    expect(res.status).toBe(401);
  });

  it("403 — rôle CLIENT non autorisé", async () => {
    const token = await loginAs("client@gmail.com");
    const clinic = await getPrisma().clinic.findFirst();

    const res = await request(app)
      .get(`/api/clinics/${clinic!.id}/staffs`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("200 — DIRECTOR retourne le staff de sa clinique", async () => {
    const token = await loginAs("directeur@gmail.com");
    const clinic = await getPrisma().clinic.findFirst({
      where: {
        director: {
          user: { email: "directeur@gmail.com" },
        },
      },
    });
    const res = await request(app)
      .get(`/api/clinics/${clinic!.id}/staffs`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── GET /api/clinics/:id/clients ───────────────────────────────────────────────

describe("GET /api/clinics/:id/clients", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/clinics/some-id/clients");
    expect(res.status).toBe(401);
  });

  it("403 — rôle CLIENT non autorisé", async () => {
    const token = await loginAs("client@gmail.com");
    const clinic = await getPrisma().clinic.findFirst();

    const res = await request(app)
      .get(`/api/clinics/${clinic!.id}/clients`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("200 — DIRECTOR retourne les clients de sa clinique", async () => {
    const token = await loginAs("directeur@gmail.com");
    const clinic = await getPrisma().clinic.findFirst({
      where: {
        director: {
          user: { email: "directeur@gmail.com" },
        },
      },
    });
    const res = await request(app)
      .get(`/api/clinics/${clinic!.id}/clients`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

// ── GET /api/clinics/me ────────────────────────────────────────────────────────

describe("GET /api/clinics/me", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/clinics/me");
    expect(res.status).toBe(401);
  });

  it("403 — rôle CLIENT non autorisé", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get("/api/clinics/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("200 — DIRECTOR retourne sa clinique", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .get("/api/clinics/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("200 — VETERINARIAN retourne ses cliniques (potentiellement plusieurs)", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .get("/api/clinics/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── PATCH /api/clinics ──────────────────────────────────────────────────────

describe("PATCH /api/clinics", () => {
  it("401 — sans token", async () => {
    const res = await request(app).patch("/api/clinics").send({});
    expect(res.status).toBe(401);
  });

  it("403 — rôle VETERINARIAN non autorisé", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .patch("/api/clinics")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Nouveau nom" });
    expect(res.status).toBe(403);
  });

  it("400 — body invalide", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .patch("/api/clinics")
      .set("Authorization", `Bearer ${token}`)
      .send({ siret: "invalide" });
    expect(res.status).toBe(400);
  });

  it("200 — DIRECTOR met à jour sa clinique", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .patch("/api/clinics")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Description mise à jour" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("description", "Description mise à jour");
  });
});

// ── DELETE /api/clinics/:id ──────────────────────────────────────────────────

describe("DELETE /api/clinics/:id", () => {
  afterEach(async () => {
    // Nettoyage best-effort : chaque test crée son propre directeur jetable
    // et le supprime lui-même dans le corps du test si possible.
  });

  it("401 — sans token", async () => {
    const res = await request(app).delete(`/api/clinics/${randomUUID()}`);
    expect(res.status).toBe(401);
  });

  it("403 — rôle REFERENT non autorisé", async () => {
    const token = await loginAs("referent@gmail.com");
    const res = await request(app)
      .delete(`/api/clinics/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("404 — clinique introuvable", async () => {
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .delete(`/api/clinics/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("200 — ADMIN supprime une clinique sans dépendances", async () => {
    const { clinicId, email } = await createDisposableDirectorWithClinic();

    try {
      const token = await loginAs("admin@gmail.com");
      const res = await request(app)
        .delete(`/api/clinics/${clinicId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);

      const deletedClinic = await getPrisma().clinic.findUnique({
        where: { id: clinicId },
      });
      expect(deletedClinic).toBeNull();
    } finally {
      await cleanupDisposable(email);
    }
  });

  it("200 — DIRECTOR supprime sa propre clinique sans dépendances", async () => {
    const { clinicId, email } = await createDisposableDirectorWithClinic();

    try {
      const token = await loginAs(email);
      const res = await request(app)
        .delete(`/api/clinics/${clinicId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    } finally {
      await cleanupDisposable(email);
    }
  });
});
