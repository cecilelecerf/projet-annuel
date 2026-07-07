import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
import { getPrisma } from "../../../../__tests__/setup";

dayjs.extend(utc);

describe("Internal meeting router", () => {
  let vetToken: string;
  let directorToken: string;
  let clientToken: string;

  let vetUserId: string;
  let directorUserId: string;

  beforeAll(async () => {
    vetToken = await loginAs("veto@gmail.com");
    directorToken = await loginAs("directeur@gmail.com");
    clientToken = await loginAs("client@gmail.com");

    const prisma = getPrisma();

    const vet = await prisma.user.findUnique({
      where: { email: "veto@gmail.com" },
    });

    const director = await prisma.user.findUnique({
      where: { email: "directeur@gmail.com" },
    });

    if (!vet || !director) throw new Error("Users introuvables");

    vetUserId = vet.id;
    directorUserId = director.id;
  });

  describe("POST /api/meetings/internal", () => {
    it("401 — sans token", async () => {
      const res = await request(app).post("/api/meetings/internal").send({});

      expect(res.status).toBe(401);
    });

    it("403 — CLIENT ne peut pas créer une réunion interne", async () => {
      const res = await request(app)
        .post("/api/meetings/internal")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({});

      expect(res.status).toBe(403);
    });

    it("400 — body invalide", async () => {
      const res = await request(app)
        .post("/api/meetings/internal")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          title: "Réunion",
        });

      expect(res.status).toBe(400);
    });

    it("201 — création d'une réunion interne", async () => {
      const res = await request(app)
        .post("/api/meetings/internal")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          title: "Réunion équipe",
          description: "Description",
          date: "2027-08-01",
          startTime: "1970-01-01T09:00:00.000Z",
          endTime: "1970-01-01T10:00:00.000Z",
          userIds: [vetUserId, directorUserId],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });
  });

  describe("PATCH /api/meetings/internal/:id", () => {
    async function createMeeting() {
      const res = await request(app)
        .post("/api/meetings/internal")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          title: "Réunion",
          description: "Description",
          date: "2027-09-01",
          startTime: "1970-01-01T09:00:00.000Z",
          endTime: "1970-01-01T10:00:00.000Z",
          userIds: [vetUserId],
        });

      expect(res.status).toBe(201);

      return res.body.id;
    }

    it("401 — sans token", async () => {
      const res = await request(app)
        .patch("/api/meetings/internal/test")
        .send({});

      expect(res.status).toBe(401);
    });

    it("403 — CLIENT ne peut pas modifier une réunion", async () => {
      const res = await request(app)
        .patch("/api/meetings/internal/test")
        .set("Authorization", `Bearer ${clientToken}`)
        .query({
          scope: "single",
        })
        .send({});

      expect(res.status).toBe(403);
    });

    it("200 — modification d'une réunion", async () => {
      const id = await createMeeting();

      const res = await request(app)
        .patch(`/api/meetings/internal/${id}`)
        .query({
          scope: "single",
        })
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          title: "Nouveau titre",
        });

      expect(res.status).toBe(200);
    });
  });

  describe("PATCH /api/meetings/internal/:id/participants", () => {
    async function createMeeting() {
      const res = await request(app)
        .post("/api/meetings/internal")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          title: "Réunion",
          description: "Description",
          date: "2027-09-15",
          startTime: "1970-01-01T09:00:00.000Z",
          endTime: "1970-01-01T10:00:00.000Z",
          userIds: [vetUserId],
        });

      return res.body.id;
    }

    it("401 — sans token", async () => {
      const res = await request(app)
        .patch("/api/meetings/internal/test/participants")
        .send({});

      expect(res.status).toBe(401);
    });

    it("403 — CLIENT ne peut pas modifier son statut", async () => {
      const res = await request(app)
        .patch("/api/meetings/internal/test/participants")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({
          status: "ACCEPTED",
          scope: "all",
        });

      expect(res.status).toBe(403);
    });

    it("400 — body invalide", async () => {
      const id = await createMeeting();

      const res = await request(app)
        .patch(`/api/meetings/internal/${id}/participants`)
        .set("Authorization", `Bearer ${vetToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("200 — met à jour le statut du participant", async () => {
      const id = await createMeeting();

      const res = await request(app)
        .patch(`/api/meetings/internal/${id}/participants`)
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          status: "ACCEPTED",
          scope: "all",
        });

      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /api/meetings/internal/:id", () => {
    async function createMeeting() {
      const res = await request(app)
        .post("/api/meetings/internal")
        .set("Authorization", `Bearer ${vetToken}`)
        .send({
          title: "Réunion",
          description: "Description",
          date: "2027-10-01",
          startTime: "1970-01-01T09:00:00.000Z",
          endTime: "1970-01-01T10:00:00.000Z",
          userIds: [vetUserId],
        });

      return res.body.id;
    }

    it("401 — sans token", async () => {
      const res = await request(app).delete("/api/meetings/internal/test");

      expect(res.status).toBe(401);
    });

    it("403 — CLIENT ne peut pas supprimer une réunion", async () => {
      const res = await request(app)
        .delete("/api/meetings/internal/test")
        .set("Authorization", `Bearer ${clientToken}`)
        .query({
          scope: "single",
        });

      expect(res.status).toBe(403);
    });

    it("204 — suppression d'une réunion", async () => {
      const id = await createMeeting();

      const res = await request(app)
        .delete(`/api/meetings/internal/${id}`)
        .query({
          scope: "single",
        })
        .set("Authorization", `Bearer ${vetToken}`);

      expect(res.status).toBe(204);
    });
  });
});
