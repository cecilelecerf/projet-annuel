import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { getPrisma } from "../../../__tests__/setup";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@gmail.com`;
}

// ── POST /api/staffs/veterinarian ──────────────────────────────────────────────

describe("POST /api/staffs/veterinarian", () => {
  it("401 — sans token", async () => {
    const res = await request(app).post("/api/staffs/veterinarian").send({});
    expect(res.status).toBe(401);
  });

  it("403 — rôle CLIENT non autorisé", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .post("/api/staffs/veterinarian")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("400 — body invalide", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .post("/api/staffs/veterinarian")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("201 — DIRECTOR crée un vétérinaire", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .post("/api/staffs/veterinarian")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstname: "Nouveau",
        lastname: "Veto",
        email: uniqueEmail("nouveau-veto"),
        password: "Password123!",
        licenseNumber: `LIC-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).not.toHaveProperty("password");
  });

  it("201 — REFERENT crée un vétérinaire", async () => {
    const token = await loginAs("referent@gmail.com");
    const res = await request(app)
      .post("/api/staffs/veterinarian")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstname: "Autre",
        lastname: "Veto",
        email: uniqueEmail("autre-veto"),
        password: "Password123!",
        licenseNumber: `LIC-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });
});

// ── POST /api/staffs/secretary ──────────────────────────────────────────────────

describe("POST /api/staffs/secretary", () => {
  it("401 — sans token", async () => {
    const res = await request(app).post("/api/staffs/secretary").send({});
    expect(res.status).toBe(401);
  });

  it("403 — rôle VETERINARIAN non autorisé", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .post("/api/staffs/secretary")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("400 — body invalide", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .post("/api/staffs/secretary")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("201 — DIRECTOR crée une secrétaire", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .post("/api/staffs/secretary")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstname: "Nouvelle",
        lastname: "Secretaire",
        email: uniqueEmail("nouvelle-sec"),
        password: "Password123!",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).not.toHaveProperty("password");
  });
});

// ── POST /api/staffs/referent ────────────────────────────────────────────────

describe("POST /api/staffs/referent", () => {
  it("401 — sans token", async () => {
    const res = await request(app).post("/api/staffs/referent").send({});
    expect(res.status).toBe(401);
  });

  it("403 — REFERENT ne peut pas créer un autre référent", async () => {
    const token = await loginAs("referent@gmail.com");
    const res = await request(app)
      .post("/api/staffs/referent")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("400 — body invalide", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .post("/api/staffs/referent")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("201 — DIRECTOR crée un référent", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .post("/api/staffs/referent")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstname: "Nouveau",
        lastname: "Referent",
        email: uniqueEmail("nouveau-ref"),
        password: "Password123!",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).not.toHaveProperty("password");
  });
});

// ── GET /api/staffs/:id ────────────────────────────────────────────────────────

describe("GET /api/staffs/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/staffs/some-id");
    expect(res.status).toBe(401);
  });

  it("403 — rôle CLIENT non autorisé", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get("/api/staffs/some-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("200 — DIRECTOR retourne le détail d'un membre de sa clinique", async () => {
    const token = await loginAs("directeur@gmail.com");
    const director = await getPrisma().user.findFirst({
      where: { email: "directeur@gmail.com" },
      include: {
        directorClinicProfile: {
          include: {
            clinic: {
              include: {
                veterinarianClinics: {
                  include: { veterinarian: { include: { user: true } } },
                },
              },
            },
          },
        },
      },
    });
    const vetUser =
      director?.directorClinicProfile?.clinic?.veterinarianClinics[0]
        .veterinarian.user;
    const res = await request(app)
      .get(`/api/staffs/${vetUser!.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", vetUser!.id);
    expect(res.body).not.toHaveProperty("password");
  });
});
