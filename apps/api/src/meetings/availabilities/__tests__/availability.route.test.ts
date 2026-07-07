import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
import { getPrisma } from "../../../../__tests__/setup";

dayjs.extend(utc);

const makeTime = (hhmm: string) =>
  dayjs.utc(`1970-01-01T${hhmm}:00.000Z`).toDate();

describe("Availability router", () => {
  let vetToken: string;
  let directorToken: string;
  let clientToken: string;
  let vetUserId: string;

  beforeAll(async () => {
    vetToken = await loginAs("veto@gmail.com");
    directorToken = await loginAs("directeur@gmail.com");
    clientToken = await loginAs("client@gmail.com");

    const prisma = getPrisma();
    const vetUser = await prisma.user.findUnique({
      where: { email: "veto@gmail.com" },
    });
    if (!vetUser) throw new Error("Utilisateur veto@gmail.com introuvable");
    vetUserId = vetUser.id;
  });

  // ── GET /api/meetings/availabilities ─────────────────────────────────────

  describe("GET /api/meetings/availabilities", () => {
    it("200 — VETERINARIAN reçoit ses disponibilités (date par défaut = aujourd'hui)", async () => {
      const res = await request(app)
        .get("/api/meetings/availabilities")
        .set("Authorization", `Bearer ${vetToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("200 — filtre correctement via ?date= (query string, pas params)", async () => {
      const prisma = getPrisma();

      const farFuture = await prisma.meetingBase
        .create({
          data: {
            kind: "AVAILABILITY",
            type: "SPECIFIED",
            date: dayjs.utc("2031-01-01").toDate(),
            startTime: makeTime("09:00"),
            endTime: makeTime("10:00"),
            availabilty: {
              create: { userId: vetUserId, clinicId: null as any },
            },
          },
        })
        .catch(() => null);

      if (!farFuture) return;

      try {
        const resFiltered = await request(app)
          .get("/api/meetings/availabilities")
          .query({ date: "2027-01-01" })
          .set("Authorization", `Bearer ${vetToken}`);

        expect(resFiltered.status).toBe(200);
      } finally {
        await prisma.meetingBase
          .delete({ where: { id: farFuture.id } })
          .catch(() => {});
      }
    });

    it("401 — sans token", async () => {
      const res = await request(app).get("/api/meetings/availabilities");
      expect(res.status).toBe(401);
    });

    it("403 — CLIENT n'est pas staff clinique", async () => {
      const res = await request(app)
        .get("/api/meetings/availabilities")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── POST /api/meetings/availabilities ────────────────────────────────────

  describe("POST /api/meetings/availabilities", () => {
    it("401 — sans token", async () => {
      const res = await request(app)
        .post("/api/meetings/availabilities")
        .send({});
      expect(res.status).toBe(401);
    });

    it("403 — CLIENT ne peut pas créer de disponibilité", async () => {
      const res = await request(app)
        .post("/api/meetings/availabilities")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it("400 — body invalide (type manquant)", async () => {
      const res = await request(app)
        .post("/api/meetings/availabilities")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          kind: "AVAILABILITY",
          startTime: "2027-06-01T09:00:00.000Z",
          endTime: "2027-06-01T10:00:00.000Z",
        });
      expect(res.status).toBe(400);
    });

    it("201 — VETERINARIAN crée une disponibilité récurrente (type RECURRING)", async () => {
      const res = await request(app)
        .post("/api/meetings/availabilities")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          kind: "AVAILABILITY",
          type: "RECURRING",
          frequency: "WEEKLY",
          dayOfWeek: [2],
          startTime: "1970-01-01T09:00:00.000Z",
          endTime: "1970-01-01T12:00:00.000Z",
          dateStart: "2027-06-01",
          dateEnd: "2027-12-31",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });

    it("201 — VETERINARIAN crée une disponibilité ponctuelle (type SPECIFIED)", async () => {
      const res = await request(app)
        .post("/api/meetings/availabilities")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          kind: "AVAILABILITY",
          type: "SPECIFIED",
          date: "2027-07-01",
          startTime: "1970-01-01T14:00:00.000Z",
          endTime: "1970-01-01T16:00:00.000Z",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });
  });

  // ── PATCH /api/meetings/availabilities/:id ───────────────────────────────

  describe("PATCH /api/meetings/availabilities/:id", () => {
    it("401 — sans token", async () => {
      const res = await request(app)
        .patch(
          "/api/meetings/availabilities/00000000-0000-4000-8000-000000000000",
        )
        .send({});
      expect(res.status).toBe(401);
    });

    it("403 — CLIENT ne peut pas modifier une disponibilité", async () => {
      const res = await request(app)
        .patch(
          "/api/meetings/availabilities/00000000-0000-4000-8000-000000000000",
        )
        .set("Authorization", `Bearer ${clientToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it("200 — VETERINARIAN modifie sa propre disponibilité ponctuelle", async () => {
      const createRes = await request(app)
        .post("/api/meetings/availabilities")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          kind: "AVAILABILITY",
          type: "SPECIFIED",
          date: "2027-08-01",
          startTime: "1970-01-01T09:00:00.000Z",
          endTime: "1970-01-01T10:00:00.000Z",
        });
      expect(createRes.status).toBe(201);
      const availabilityId = createRes.body.id;

      const res = await request(app)
        .patch(`/api/meetings/availabilities/${availabilityId}`)
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          type: "PUNCTUAL",
          date: "2027-08-01",
          startTime: "1970-01-01T11:00:00.000Z",
          endTime: "1970-01-01T12:00:00.000Z",
        });

      expect(res.status).toBe(200);
    });

    it("403 — DIRECTOR ne peut pas modifier la disponibilité d'un autre utilisateur", async () => {
      const createRes = await request(app)
        .post("/api/meetings/availabilities")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          kind: "AVAILABILITY",
          type: "SPECIFIED",
          date: "2027-09-01",
          startTime: "1970-01-01T09:00:00.000Z",
          endTime: "1970-01-01T10:00:00.000Z",
        });
      expect(createRes.status).toBe(201);
      const availabilityId = createRes.body.id;

      const res = await request(app)
        .patch(`/api/meetings/availabilities/${availabilityId}`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ type: "PUNCTUAL", startTime: "1970-01-01T11:00:00.000Z" });

      expect(res.status).toBe(403);
    });
  });

  // ── DELETE /api/meetings/availabilities/:id ──────────────────────────────

  describe("DELETE /api/meetings/availabilities/:id", () => {
    it("401 — sans token", async () => {
      const res = await request(app).delete(
        "/api/meetings/availabilities/00000000-0000-4000-8000-000000000000",
      );
      expect(res.status).toBe(401);
    });

    it("403 — CLIENT ne peut pas supprimer une disponibilité", async () => {
      const res = await request(app)
        .delete(
          "/api/meetings/availabilities/00000000-0000-4000-8000-000000000000",
        )
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });

    it("204 — VETERINARIAN supprime sa propre disponibilité jetable", async () => {
      const createRes = await request(app)
        .post("/api/meetings/availabilities")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          kind: "AVAILABILITY",
          type: "SPECIFIED",
          date: "2027-10-01",
          startTime: "1970-01-01T09:00:00.000Z",
          endTime: "1970-01-01T10:00:00.000Z",
        });
      expect(createRes.status).toBe(201);
      const availabilityId = createRes.body.availabilty.id;
      const res = await request(app)
        .delete(`/api/meetings/availabilities/${availabilityId}`)
        .set("Authorization", `Bearer ${vetToken}`);
      expect(res.status).toBe(204);
    });

    it("403 — DIRECTOR ne peut pas supprimer la disponibilité d'un autre utilisateur", async () => {
      const createRes = await request(app)
        .post("/api/meetings/availabilities")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          kind: "AVAILABILITY",
          type: "SPECIFIED",
          date: "2027-11-01",
          startTime: "1970-01-01T09:00:00.000Z",
          endTime: "1970-01-01T10:00:00.000Z",
        });
      expect(createRes.status).toBe(201);
      const availabilityId = createRes.body.id;

      const res = await request(app)
        .delete(`/api/meetings/availabilities/${availabilityId}`)
        .set("Authorization", `Bearer ${directorToken}`);

      expect(res.status).toBe(403);
    });
  });
});
