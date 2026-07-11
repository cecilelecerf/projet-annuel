import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { hash } from "bcryptjs";
import { app } from "@api/app";
import { getPrisma } from "../../../__tests__/setup";

const loginAs = async (email: string, password = "Password123!") => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res.body.accessToken as string;
};

describe("GET /api/admin/users", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });

  it("403 — rôle CLIENT non autorisé", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("200 — ADMIN liste tous les comptes", async () => {
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).not.toHaveProperty("password");
  });
});

describe("DELETE /api/admin/users/:id", () => {
  const email = "a-supprimer-admin@test.com";

  beforeEach(async () => {
    await getPrisma().user.deleteMany({ where: { email } });
  });
  afterEach(async () => {
    await getPrisma().user.deleteMany({ where: { email } });
  });

  it("401 — sans token", async () => {
    const res = await request(app).delete(
      "/api/admin/users/00000000-0000-0000-0000-000000000000",
    );
    expect(res.status).toBe(401);
  });

  it("403 — rôle SECRETARY non autorisé", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const res = await request(app)
      .delete("/api/admin/users/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("404 — utilisateur introuvable", async () => {
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .delete("/api/admin/users/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("400 — un admin ne peut pas se supprimer lui-même via cette route", async () => {
    const admin = await getPrisma().user.findUnique({
      where: { email: "admin@gmail.com" },
    });
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .delete(`/api/admin/users/${admin!.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("200 — supprime un compte client sans données liées", async () => {
    const password = await hash("Password123!", 10);
    const user = await getPrisma().user.create({
      data: {
        email,
        firstname: "A",
        lastname: "Supprimer",
        password,
        role: "CLIENT",
        clientProfile: {
          create: { dateOfBirth: new Date("1990-01-01") },
        },
      },
    });

    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .delete(`/api/admin/users/${user.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    const stillExists = await getPrisma().user.findUnique({
      where: { id: user.id },
    });
    expect(stillExists).toBeNull();
  });

  it("400 — refuse de supprimer un vétérinaire avec des rendez-vous", async () => {
    const vet = await getPrisma().veterinarianProfile.findFirst({
      where: { user: { email: "veto@gmail.com" } },
      include: { user: true },
    });
    const appointmentCount = await getPrisma().animalMeeting.count({
      where: { veterinarianClinic: { veterinarianId: vet!.id } },
    });
    // Le seed rattache toujours au moins un rendez-vous à veto@gmail.com.
    expect(appointmentCount).toBeGreaterThan(0);

    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .delete(`/api/admin/users/${vet!.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/rendez-vous/);

    const stillExists = await getPrisma().user.findUnique({
      where: { id: vet!.id },
    });
    expect(stillExists).not.toBeNull();
  });
});
