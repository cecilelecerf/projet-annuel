import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
import { getPrisma } from "../../../../__tests__/setup";

describe("ClinicAct router", () => {
  let adminToken: string;
  let directorToken: string;
  let referentToken: string;
  let vetToken: string;
  let secretaryToken: string;
  let clientToken: string;
  let actId: string;
  let clinicActId: string;
  let clinicId: string;

  // Crée un acte jetable pour éviter les collisions sur la contrainte
  // unique (actId, clinicId) quand plusieurs tests créent un clinicAct
  // sur la même clinique.
  const createDisposableActId = async () => {
    const prisma = getPrisma();
    const act = await prisma.act.create({
      data: {
        name: `Acte jetable ${Date.now()}-${Math.random().toString(36).slice(2)}`,
        description: "Acte créé pour un test",
        type: "CONSULTATION",
        basePrice: 10,
      },
    });
    return act.id;
  };

  beforeAll(async () => {
    adminToken = await loginAs("admin@gmail.com");
    directorToken = await loginAs("directeur@gmail.com");
    referentToken = await loginAs("referent@gmail.com");
    vetToken = await loginAs("veto@gmail.com");
    secretaryToken = await loginAs("secretaire@gmail.com");
    clientToken = await loginAs("client@gmail.com");

    const prisma = getPrisma();
    const act = await prisma.act.findFirst();
    if (!act) throw new Error("Aucun acte seedé pour les tests");
    actId = act.id;

    const clinicAct = await prisma.clinicAct.findFirst();
    if (!clinicAct) throw new Error("Aucun clinicAct seedé pour les tests");
    clinicActId = clinicAct.id;
    clinicId = clinicAct.clinicId;
  });

  // ── GET /api/clinics/:clinicId/acts ───────────────────────────────────────────

  describe("GET /api/clinics/:clinicId/acts", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/clinics/some-id/acts");
      expect(res.status).toBe(401);
    });

    it("403 — rôle CLIENT non autorisé", async () => {
      const token = await loginAs("client@gmail.com");
      const clinic = await getPrisma().clinic.findFirst();

      const res = await request(app)
        .get(`/api/clinics/${clinic!.id}/acts`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("403 — rôle ADMIN non autorisé (absent de CLINIC_STAFF_ROLES)", async () => {
      const token = await loginAs("admin@gmail.com");
      const clinic = await getPrisma().clinic.findFirst();

      const res = await request(app)
        .get(`/api/clinics/${clinic!.id}/acts`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("200 — DIRECTOR retourne les actes de sa clinique", async () => {
      const token = await loginAs("directeur@gmail.com");
      const clinic = await getPrisma().clinic.findFirst({
        where: {
          director: {
            user: { email: "directeur@gmail.com" },
          },
        },
      });

      const res = await request(app)
        .get(`/api/clinics/${clinic!.id}/acts`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("200 — VETERINARIAN retourne les actes de la clinique", async () => {
      const token = await loginAs("veto@gmail.com");
      const clinic = await getPrisma().clinic.findFirst();

      const res = await request(app)
        .get(`/api/clinics/${clinic!.id}/acts`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("200 — SECRETARY retourne les actes de la clinique", async () => {
      const token = await loginAs("secretaire@gmail.com");
      const clinic = await getPrisma().clinic.findFirst();

      const res = await request(app)
        .get(`/api/clinics/${clinic!.id}/acts`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it("200 — REFERENT retourne les actes de la clinique", async () => {
      const token = await loginAs("referent@gmail.com");
      const clinic = await getPrisma().clinic.findFirst();

      const res = await request(app)
        .get(`/api/clinics/${clinic!.id}/acts`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  // ── GET /api/clinics/:clinicId/acts/:id ─────────────────────────────────────────────

  describe("GET /api/clinics/:clinicId/acts/:id", () => {
    it("200 — ADMIN reçoit le clinicAct", async () => {
      const res = await request(app)
        .get(`/api/clinics/:clinicId/acts/${clinicActId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(clinicActId);
    });

    it("200 — VETERINARIAN reçoit le clinicAct", async () => {
      const res = await request(app)
        .get(`/api/clinics/:clinicId/acts/${clinicActId}`)
        .set("Authorization", `Bearer ${vetToken}`);
      expect(res.status).toBe(200);
    });

    it("200 — SECRETARY reçoit le clinicAct", async () => {
      const res = await request(app)
        .get(`/api/clinics/:clinicId/acts/${clinicActId}`)
        .set("Authorization", `Bearer ${secretaryToken}`);
      expect(res.status).toBe(200);
    });

    it("404 — clinicAct inexistant", async () => {
      const res = await request(app)
        .get(`/api/clinics/:clinicId/acts/00000000-0000-4000-8000-000000000000`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("401 — sans token", async () => {
      const res = await request(app).get(
        `/api/clinics/:clinicId/acts/${clinicActId}`,
      );
      expect(res.status).toBe(401);
    });

    it("403 — CLIENT n'est pas staff", async () => {
      const res = await request(app)
        .get(`/api/clinics/:clinicId/acts/${clinicActId}`)
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── POST /api/clinics/:clinicId/acts ────────────────────────────────────────────────

  describe("POST /api/clinics/:clinicId/acts", () => {
    it("401 — sans token", async () => {
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/acts`)
        .send({});
      expect(res.status).toBe(401);
    });

    it("403 — ADMIN ne peut pas créer de clinicAct", async () => {
      const disposableActId = await createDisposableActId();
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/acts`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ actId: disposableActId, price: 60 });
      expect(res.status).toBe(403);
    });

    it("409 — impossible de créer un clinicAct en double sur le même (actId, clinicId)", async () => {
      const disposableActId = await createDisposableActId();

      const first = await request(app)
        .post(`/api/clinics/${clinicId}/acts`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ actId: disposableActId, price: 60 });
      expect(first.status).toBe(201);

      const duplicate = await request(app)
        .post(`/api/clinics/${clinicId}/acts`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ actId: disposableActId, price: 80 });

      expect(duplicate.status).toBe(409);
    });
    it("403 — VETERINARIAN ne peut pas créer de clinicAct", async () => {
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/acts`)
        .set("Authorization", `Bearer ${vetToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it("403 — SECRETARY ne peut pas créer de clinicAct", async () => {
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/acts`)
        .set("Authorization", `Bearer ${secretaryToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it("201 — DIRECTOR crée un clinicAct", async () => {
      const disposableActId = await createDisposableActId();
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/acts`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ actId: disposableActId, price: 60 });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });

    it("201 — REFERENT crée un clinicAct", async () => {
      const disposableActId = await createDisposableActId();
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/acts`)
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ actId: disposableActId, price: 70 });

      expect(res.status).toBe(201);
    });
  });

  // ── PATCH /api/clinics/:clinicId/acts/:id ───────────────────────────────────────────

  describe("PATCH /api/clinics/:clinicId/acts/:id", () => {
    it("403 — ADMIN ne peut plus modifier un clinicAct", async () => {
      const res = await request(app)
        .patch(`/api/clinics/:clinicId/acts/${clinicActId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ price: 99 });
      expect(res.status).toBe(403);
    });

    it("200 — DIRECTOR modifie un clinicAct", async () => {
      const res = await request(app)
        .patch(`/api/clinics/:clinicId/acts/${clinicActId}`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ price: 55 });

      expect(res.status).toBe(200);
    });

    it("200 — REFERENT modifie un clinicAct", async () => {
      const res = await request(app)
        .patch(`/api/clinics/:clinicId/acts/${clinicActId}`)
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ price: 65 });

      expect(res.status).toBe(200);
    });

    it("404 — clinicAct inexistant", async () => {
      const res = await request(app)
        .patch(
          "/api/clinics/:clinicId/acts/00000000-0000-4000-8000-000000000000",
        )
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ price: 10 });
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/clinics/:clinicId/acts/:id ──────────────────────────────────────────

  describe("DELETE /api/clinics/:clinicId/acts/:id", () => {
    it("403 — ADMIN ne peut plus supprimer un clinicAct", async () => {
      const res = await request(app)
        .delete(`/api/clinics/:clinicId/acts/${clinicActId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });

    it("403 — VETERINARIAN ne peut pas supprimer un clinicAct", async () => {
      const res = await request(app)
        .delete(`/api/clinics/:clinicId/acts/${clinicActId}`)
        .set("Authorization", `Bearer ${vetToken}`);
      expect(res.status).toBe(403);
    });

    it("204 — DIRECTOR supprime un clinicAct", async () => {
      const prisma = getPrisma();
      const disposableActId = await createDisposableActId();
      const disposable = await prisma.clinicAct.create({
        data: { actId: disposableActId, clinicId, price: 20 },
      });

      const res = await request(app)
        .delete(`/api/clinics/:clinicId/acts/${disposable.id}`)
        .set("Authorization", `Bearer ${directorToken}`);
      expect(res.status).toBe(204);

      const check = await prisma.clinicAct.findUnique({
        where: { id: disposable.id },
      });
      expect(check).toBeNull();
    });

    it("204 — REFERENT supprime un clinicAct", async () => {
      const prisma = getPrisma();
      const disposableActId = await createDisposableActId();
      const disposable = await prisma.clinicAct.create({
        data: { actId: disposableActId, clinicId, price: 25 },
      });

      const res = await request(app)
        .delete(`/api/clinics/:clinicId/acts/${disposable.id}`)
        .set("Authorization", `Bearer ${referentToken}`);
      expect(res.status).toBe(204);
    });
  });
});
