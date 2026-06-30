import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { getPrisma } from "../../../../__tests__/setup";
import { MeetingBase } from "../../../../prisma/generated/prisma/client";

const validQuery = "startDate=2026-01-01&endDate=2026-12-31";

const loginAs = async (email: string, password = "Password123!") => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res.body.accessToken as string;
};

// ── GET /api/meetings/animals/:id ──────────────────────────────────────────────

describe("GET /api/meetings/animals/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/meetings/animals/some-id");
    expect(res.status).toBe(401);
  });

  it("404 — rendez-vous introuvable", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .get("/api/meetings/animals/non-existent-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("200 — retourne le rendez-vous animal", async () => {
    const token = await loginAs("veto@gmail.com");
    const animalMeeting = await getPrisma().animalMeeting.findFirst();
    const res = await request(app)
      .get(`/api/meetings/animals/${animalMeeting!.meetingId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", animalMeeting!.id);
  });
});

// ── PATCH /api/meetings/animals/:id ────────────────────────────────────────────

describe("PATCH /api/meetings/animals/:id", () => {
  let meetingId: MeetingBase["id"] | undefined = undefined;

  beforeAll(async () => {
    await getPrisma().meetingBase.deleteMany({
      where: { kind: "ANIMAL", date: new Date("2026-04-22T00:00:00.000Z") },
    });
  });
  afterEach(async () => {
    if (meetingId)
      await getPrisma().meetingBase.deleteMany({ where: { id: meetingId } });
  });
  it("401 — sans token", async () => {
    const res = await request(app).patch("/api/meetings/animals/some-id");
    expect(res.status).toBe(401);
  });
  it("404 — Meeting n'existe pas", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .patch("/api/meetings/animals/some-id")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(404);
  });

  it("200 — VETERINARIAN met à jour un rendez-vous", async () => {
    const token = await loginAs("veto@gmail.com");
    const animal = await getPrisma().animal.findFirst();
    const speciality = await getPrisma().speciality.findFirst();
    const vetoClinic = await getPrisma().veterinarianClinic.findFirst({
      where: { veterinarian: { user: { email: "veto@gmail.com" } } },
    });
    const resCreate = await request(app)
      .post("/api/meetings/animals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-08-30",
        startTime: "1970-01-01T09:30:01.000Z",
        endTime: "1970-01-01T09:40:00.000Z",
        animalId: animal!.id,
        veterinarianId: vetoClinic!.veterinarianId,
        specialityId: speciality!.id,
      });
    meetingId = resCreate.body.id;
    const res = await request(app)
      .patch(`/api/meetings/animals/${resCreate.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ report: "Mise à jour du rapport" });
    expect(res.status).toBe(200);
  });
});

// ── DELETE /api/meetings/animals/:id ───────────────────────────────────────────

describe("DELETE /api/meetings/animals/:id", () => {
  let meetingId: string;
  afterAll(async () => {
    if (meetingId)
      await getPrisma().meetingBase.deleteMany({ where: { id: meetingId } });
  });
  // beforeAll(async () => {
  //   await getPrisma().meetingBase.deleteMany({
  //     where: { kind: "ANIMAL", date: new Date("2026-08-28T00:00:00.000Z") },
  //   });
  // });
  it("401 — sans token", async () => {
    const res = await request(app).delete("/api/meetings/animals/some-id");
    expect(res.status).toBe(401);
  });

  it("403 — rôle DIRECTOR non autorisé", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .delete("/api/meetings/animals/some-id")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("204 — VETERINARIAN supprime un rendez-vous animal", async () => {
    const token = await loginAs("veto@gmail.com");
    const animal = await getPrisma().animal.findFirst();
    const veto = await getPrisma().veterinarianProfile.findFirst({
      where: { user: { email: "veto@gmail.com" } },
    });
    const speciality = await getPrisma().speciality.findFirst();

    const created = await request(app)
      .post("/api/meetings/animals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-08-30",
        startTime: "1970-01-01T09:42:00.000Z",
        endTime: "1970-01-01T09:45:00.000Z",
        animalId: animal!.id,
        veterinarianId: veto?.id,
        specialityId: speciality!.id,
      });
    meetingId = created.body.id;
    const res = await request(app)
      .delete(`/api/meetings/animals/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
  // ── POST /api/meetings/animals ─────────────────────────────────────────────────

  describe("POST /api/meetings/animals", () => {
    let meetingId: string;
    afterAll(async () => {
      if (meetingId)
        await getPrisma().meetingBase.deleteMany({ where: { id: meetingId } });
    });

    beforeAll(async () => {
      await getPrisma().meetingBase.deleteMany({
        where: { kind: "ANIMAL", date: new Date("2026-04-02T00:00:00.000Z") },
      });
    });
    it("401 — sans token", async () => {
      const res = await request(app).post("/api/meetings/animals");
      expect(res.status).toBe(401);
    });

    it("403 — rôle DIRECTOR non autorisé", async () => {
      const token = await loginAs("directeur@gmail.com");
      const res = await request(app)
        .post("/api/meetings/animals")
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it("400 — body invalide", async () => {
      const token = await loginAs("veto@gmail.com");
      const res = await request(app)
        .post("/api/meetings/animals")
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it("201 — SECRETARY crée un rendez-vous animal", async () => {
      const token = await loginAs("secretaire@gmail.com");
      const animal = await getPrisma().animal.findFirst();
      const speciality = await getPrisma().speciality.findFirst();
      const vetoClinic = await getPrisma().veterinarianClinic.findFirst({
        where: { veterinarian: { user: { email: "veto@gmail.com" } } },
      });

      const res = await request(app)
        .post("/api/meetings/animals")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: "2026-08-30",
          startTime: "1970-01-01T09:50:00.000Z",
          endTime: "1970-01-01T09:55:00.000Z",
          animalId: animal!.id,
          veterinarianId: vetoClinic?.veterinarianId,
          specialityId: speciality!.id,
          clinicId: vetoClinic?.clinicId,
        });
      meetingId = res.body.id;
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });
  });
});
