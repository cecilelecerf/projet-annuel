import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.route.test";
import { getPrisma } from "../../../__tests__/setup";

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
        directorClinicProfile: {
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
        directorClinicProfile: {
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

// ── PATCH /api/clinics/me ──────────────────────────────────────────────────────

describe("PATCH /api/clinics/me", () => {
  it("401 — sans token", async () => {
    const res = await request(app).patch("/api/clinics/me").send({});
    expect(res.status).toBe(401);
  });

  it("403 — rôle REFERENT non autorisé", async () => {
    const token = await loginAs("referent@gmail.com");
    const res = await request(app)
      .patch("/api/clinics/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Nouveau nom" });
    expect(res.status).toBe(403);
  });

  it("400 — body invalide", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .patch("/api/clinics/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ siret: "invalide" });
    expect(res.status).toBe(400);
  });

  it("200 — DIRECTOR met à jour sa clinique", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .patch("/api/clinics/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Description mise à jour" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("description", "Description mise à jour");
  });
});
