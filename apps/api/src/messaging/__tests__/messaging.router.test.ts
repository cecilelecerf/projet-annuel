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

  describe("GET /api/conversations/:id", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get(
        "/api/conversations/00000000-0000-4000-8000-000000000000",
      );
      expect(res.status).toBe(401);
    });

    it("200 — retourne la conversation avec ses messages paginés", async () => {
      const contactsRes = await request(app)
        .get("/api/conversations/contacts")
        .set("Authorization", `Bearer ${directorToken}`);
      const target = contactsRes.body.clinic[0];
      if (!target) return;

      const createRes = await request(app)
        .post("/api/conversations")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ type: "DIRECT", userId: target.id });
      const conversationId = createRes.body.id;

      const res = await request(app)
        .get(`/api/conversations/${conversationId}`)
        .set("Authorization", `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("conversation");
      expect(res.body).toHaveProperty("messages");
      expect(res.body).toHaveProperty("hasMore");
    });
  });

  describe("PATCH /api/conversations/:id — renommer un groupe", () => {
    it("200 — un ADMIN peut renommer un groupe", async () => {
      const contactsRes = await request(app)
        .get("/api/conversations/contacts")
        .set("Authorization", `Bearer ${directorToken}`);
      const target = contactsRes.body.clinic[0];
      if (!target) return;

      const createRes = await request(app)
        .post("/api/conversations")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({
          type: "GROUP",
          scope: "CLINIC",
          clinicId: target.clinics?.[0]?.id ?? contactsRes.body.clinic[0].clinics?.[0]?.id,
          name: "Groupe initial",
          memberIds: [target.id],
        });
      if (createRes.status !== 201) return;
      const conversationId = createRes.body.id;

      const res = await request(app)
        .patch(`/api/conversations/${conversationId}`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ name: "Nouveau nom" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Nouveau nom");
    });

    it("403 — un non-admin ne peut pas renommer", async () => {
      const contactsRes = await request(app)
        .get("/api/conversations/contacts")
        .set("Authorization", `Bearer ${directorToken}`);
      const target = contactsRes.body.clinic[0];
      if (!target) return;

      const createRes = await request(app)
        .post("/api/conversations")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ type: "DIRECT", userId: target.id });
      const conversationId = createRes.body.id;

      const res = await request(app)
        .patch(`/api/conversations/${conversationId}`)
        .set("Authorization", `Bearer ${veterinarianToken}`)
        .send({ name: "Tentative" });

      expect([403, 404]).toContain(res.status);
    });
  });

  describe("Gestion des membres d'un groupe", () => {
    it("ajoute, promeut puis retire un membre", async () => {
      const contactsRes = await request(app)
        .get("/api/conversations/contacts")
        .set("Authorization", `Bearer ${directorToken}`);
      const clinicContacts = contactsRes.body.clinic;
      if (clinicContacts.length < 2) return;

      const clinicId = clinicContacts[0].clinics?.[0]?.id;
      if (!clinicId) return;

      const createRes = await request(app)
        .post("/api/conversations")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({
          type: "GROUP",
          scope: "CLINIC",
          clinicId,
          name: "Groupe test membres",
          memberIds: [clinicContacts[0].id],
        });
      if (createRes.status !== 201) return;
      const conversationId = createRes.body.id;
      const newMemberId = clinicContacts[1].id;

      // ── Ajout ────────────────────────────────────────────────────────────
      const addRes = await request(app)
        .post(`/api/conversations/${conversationId}/members`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ memberIds: [newMemberId] });
      expect(addRes.status).toBe(200);
      expect(
        addRes.body.conversationMembers.some((m: any) => m.userId === newMemberId),
      ).toBe(true);

      // ── Promotion ────────────────────────────────────────────────────────
      const promoteRes = await request(app)
        .patch(`/api/conversations/${conversationId}/members/${newMemberId}`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ role: "ADMIN" });
      expect(promoteRes.status).toBe(200);
      expect(promoteRes.body.role).toBe("ADMIN");

      // ── Retrait ──────────────────────────────────────────────────────────
      const removeRes = await request(app)
        .delete(`/api/conversations/${conversationId}/members/${newMemberId}`)
        .set("Authorization", `Bearer ${directorToken}`);
      expect(removeRes.status).toBe(204);
    });
  });

  describe("POST /api/conversations/:id/read", () => {
    it("200 — marque la conversation comme lue après un message", async () => {
      const contactsRes = await request(app)
        .get("/api/conversations/contacts")
        .set("Authorization", `Bearer ${directorToken}`);
      const target = contactsRes.body.clinic[0];
      if (!target) return;

      const createRes = await request(app)
        .post("/api/conversations")
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ type: "DIRECT", userId: target.id });
      const conversationId = createRes.body.id;

      const readRes = await request(app)
        .post(`/api/conversations/${conversationId}/read`)
        .set("Authorization", `Bearer ${directorToken}`);

      expect(readRes.status).toBe(204);
    });
  });
});