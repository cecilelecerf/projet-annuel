import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";

describe("Messaging router", () => {
  let veterinarianToken: string;
  let directorToken: string;
  let secretaryToken: string;
  let clientToken: string;

  beforeAll(async () => {
    veterinarianToken = await loginAs("veto@gmail.com");
    directorToken = await loginAs("directeur@gmail.com");
    secretaryToken = await loginAs("secretaire@gmail.com");
    clientToken = await loginAs("client@gmail.com");
  });

  describe("GET /api/conversations/contacts", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/conversations/contacts");
      expect(res.status).toBe(401);
    });

    it("403 — CLIENT n'a pas accès à la messagerie interne", async () => {
      const res = await request(app)
        .get("/api/conversations/contacts")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });

    it("200 — VETERINARIAN reçoit ses contacts (clinique + réseau)", async () => {
      const res = await request(app)
        .get("/api/conversations/contacts")
        .set("Authorization", `Bearer ${veterinarianToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.clinic)).toBe(true);
      if (res.body.clinic.length > 0) {
        expect(res.body.clinic[0]).toHaveProperty("clinics");
      }
    });

    it("200 — DIRECTOR reçoit en plus la liste des autres directeurs, avec leur clinique", async () => {
      const res = await request(app)
        .get("/api/conversations/contacts")
        .set("Authorization", `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.directors)).toBe(true);
      if (res.body.directors.length > 0) {
        expect(res.body.directors[0]).toHaveProperty("clinics");
      }
    });

    it("200 — SECRETARY ne reçoit pas de liste de directeurs", async () => {
      const res = await request(app)
        .get("/api/conversations/contacts")
        .set("Authorization", `Bearer ${secretaryToken}`);

      expect(res.status).toBe(200);
      expect(res.body.directors).toBeUndefined();
    });
  });

  describe("GET /api/conversations", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/conversations");
      expect(res.status).toBe(401);
    });

    it("200 — renvoie la liste des conversations avec unreadCount", async () => {
      const res = await request(app)
        .get("/api/conversations")
        .set("Authorization", `Bearer ${veterinarianToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty("unreadCount");
      }
    });
  });

  describe("POST /api/conversations — création + envoi de message", () => {
    it("crée une conversation directe puis un message n'incrémente pas son propre compteur non lu", async () => {
      const contactsRes = await request(app)
        .get("/api/conversations/contacts")
        .set("Authorization", `Bearer ${directorToken}`);
      const target = contactsRes.body.clinic[0];
      if (!target) return;

      const createRes = await request(app)
        .post("/api/conversations")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ type: "DIRECT", userId: target.id });
      expect(createRes.status).toBe(201);
      const conversationId = createRes.body.id;

      for (const member of createRes.body.conversationMembers) {
        expect(member.user).not.toHaveProperty("avatar");
      }

      const sendRes = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ content: "Bonjour" });
      expect(sendRes.status).toBe(201);

      const listRes = await request(app)
        .get("/api/conversations")
        .set("Authorization", `Bearer ${directorToken}`);
      const conv = listRes.body.find((c: any) => c.id === conversationId);
      expect(conv.unreadCount).toBe(0);
    });

    it("400 — groupe de portée CLINIC sans clinicId explicite", async () => {
      const res = await request(app)
        .post("/api/conversations")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({
          type: "GROUP",
          scope: "CLINIC",
          name: "Test sans clinique",
          memberIds: ["00000000-0000-4000-8000-000000000000"],
        });
      expect(res.status).toBe(400);
    });

    it("403 — SECRETARY ne peut pas créer un groupe de portée DIRECTOR_NETWORK", async () => {
      const res = await request(app)
        .post("/api/conversations")
        .set("Authorization", `Bearer ${secretaryToken}`)
        .send({
          type: "GROUP",
          scope: "DIRECTOR_NETWORK",
          name: "Réseau",
          memberIds: [
            "00000000-0000-4000-8000-000000000000",
            "00000000-0000-4000-8000-000000000001",
          ],
        });
      expect(res.status).toBe(403);
    });

    it("403 — SECRETARY ne peut pas créer un groupe de portée VETERINARIAN_NETWORK", async () => {
      const res = await request(app)
        .post("/api/conversations")
        .set("Authorization", `Bearer ${secretaryToken}`)
        .send({
          type: "GROUP",
          scope: "VETERINARIAN_NETWORK",
          name: "Vétos",
          memberIds: [
            "00000000-0000-4000-8000-000000000000",
            "00000000-0000-4000-8000-000000000001",
          ],
        });
      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/conversations/:id/read", () => {
    it("401 — sans token", async () => {
      const res = await request(app).post(
        "/api/conversations/00000000-0000-4000-8000-000000000000/read",
      );
      expect(res.status).toBe(401);
    });
  });
});