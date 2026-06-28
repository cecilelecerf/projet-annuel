import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { getPrisma } from "../../../__tests__/setup";

const loginAs = async (email: string, password = "Password123!") => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res.body.accessToken as string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const getMeetingId = async () => {
  const meeting = await getPrisma().animalMeeting.findFirst({
    include: { meeting: true },
  });
  return meeting!.meeting!.id;
};

const getValidBody = async () => {
  const clinicAct = await getPrisma().clinicAct.findFirst({
    include: { act: true },
  });
  return {
    clinicActId: clinicAct!.id,
    performedAt: new Date().toISOString(),
    analysis: {
      analysisType: "BLOOD",
      status: "PENDING",
    },
  };
};

// ── GET /api/medical-histories/:id ─────────────────────────────────

describe("GET /api/medical-histories/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/medical-histories/some-id");
    expect(res.status).toBe(401);
  });

  it("403 — rôle CLIENT non autorisé", async () => {
    const token = await loginAs("client@gmail.com");
    const history = await getPrisma().animalMedicalHistory.findFirst({
      include: { animalMeeting: { include: { meeting: true } } },
    });
    const res = await request(app)
      .get(`/api/medical-histories/${history?.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("404 — acte introuvable", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .get(`/api/medical-histories/non-existent-id`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("200 — VETERINARIAN retourne l'acte", async () => {
    const token = await loginAs("veto@gmail.com");
    const history = await getPrisma().animalMedicalHistory.findFirst({
      include: { animalMeeting: { include: { meeting: true } } },
    });

    const res = await request(app)
      .get(`/api/medical-histories/${history!.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", history!.id);
  });
});

// ── POST /api/medical-histories ────────────────────────────────────
describe("POST /api/medical-histories", () => {
  it("401 — sans token", async () => {
    const res = await request(app).post(`/api/medical-histories`);
    expect(res.status).toBe(401);
  });

  it("403 — rôle CLIENT non autorisé", async () => {
    const token = await loginAs("client@gmail.com");
    const res = await request(app)
      .post(`/api/medical-histories`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("400 — body invalide", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .post(`/api/medical-histories`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("400 — STAFF sans clinicActId", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .post(`/api/medical-histories`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        performedAt: new Date().toISOString(),
        analysis: { analysisType: "BLOOD", status: "PENDING" },
      });
    expect(res.status).toBe(400);
  });

  it("201 — VETERINARIAN crée un acte médical", async () => {
    const token = await loginAs("veto@gmail.com");
    const meetingId = await getMeetingId();
    const body = await getValidBody();

    const res = await request(app)
      .post(`/api/medical-histories`)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...body, meetingId });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });

  it("201 — SECRETARY crée un acte médical", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const meetingId = await getMeetingId();
    const body = await getValidBody();

    const res = await request(app)
      .post(`/api/medical-histories`)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...body, meetingId });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });
});

// ── PATCH /api/medical-histories/:id ───────────────────────────────

describe("PATCH /api/medical-histories/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).patch("/api/medical-histories/some-id");
    expect(res.status).toBe(401);
  });

  it("403 — rôle SECRETARY non autorisé", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const history = await getPrisma().animalMedicalHistory.findFirst({
      include: { animalMeeting: { include: { meeting: true } } },
    });
    const res = await request(app)
      .patch(`/api/medical-histories/${history?.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("404 — acte introuvable", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .patch(`/api/medical-histories/non-existent-id`)
      .set("Authorization", `Bearer ${token}`)
      .send({ notes: "Mise à jour" });
    expect(res.status).toBe(404);
  });

  it("200 — VETERINARIAN met à jour un acte", async () => {
    const token = await loginAs("veto@gmail.com");
    const meetingId = await getMeetingId();
    const body = await getValidBody();

    const created = await request(app)
      .post(`/api/medical-histories`)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...body, meetingId });

    const res = await request(app)
      .patch(`/api/medical-histories/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ notes: "Notes mises à jour" });
    expect(res.status).toBe(200);
  });
});

// ── DELETE /api/medical-histories/:id ──────────────────────────────

describe("DELETE /api/medical-histories/:id", () => {
  it("401 — sans token", async () => {
    const res = await request(app).delete("/api/medical-histories/some-id");
    expect(res.status).toBe(401);
  });

  it("403 — rôle DIRECTOR non autorisé", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .delete("/api/medical-histories/some-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("404 — acte introuvable", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .delete(`/api/medical-histories/non-existent-id`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("204 — VETERINARIAN supprime un acte", async () => {
    const token = await loginAs("veto@gmail.com");
    const meetingId = await getMeetingId();
    const body = await getValidBody();

    const created = await request(app)
      .post(`/api/medical-histories`)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...body, meetingId });

    const res = await request(app)
      .delete(`/api/medical-histories/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it("204 — SECRETARY supprime un acte", async () => {
    const token = await loginAs("secretaire@gmail.com");
    const meetingId = await getMeetingId();
    const body = await getValidBody();

    const created = await request(app)
      .post(`/api/medical-histories`)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...body, meetingId });

    const res = await request(app)
      .delete(`/api/medical-histories/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});
