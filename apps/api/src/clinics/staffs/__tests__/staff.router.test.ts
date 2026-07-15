import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
import { getPrisma } from "../../../../__tests__/setup";

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@gmail.com`;
}

describe("StaffRouter", async () => {
  let adminToken: string;
  let directorToken: string;
  let referentToken: string;
  let vetToken: string;
  let secretaryToken: string;
  let clientToken: string;
  let clinicId: string;
  beforeAll(async () => {
    adminToken = await loginAs("admin@gmail.com");
    directorToken = await loginAs("directeur@gmail.com");
    referentToken = await loginAs("referent@gmail.com");
    vetToken = await loginAs("veto@gmail.com");
    secretaryToken = await loginAs("secretaire@gmail.com");
    clientToken = await loginAs("client@gmail.com");

    const prisma = getPrisma();

    const clinic = await prisma.clinic.findFirst({
      where: { director: { user: { email: "directeur@gmail.com" } } },
    });
    if (!clinic) throw new Error("Aucun clinic seedé pour les tests");
    clinicId = clinic.id;
  });

  // ── GET /api/clinics/:clinicId/staffs ────────────────────────────────────────────────

  describe("GET /api/clinics/:clinicId/staffs", () => {
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
          director: {
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

  describe("POST /api/clinics/:clinicId/staffs/veterinarian", () => {
    it("401 — sans token", async () => {
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/veterinarian`)
        .send({});
      expect(res.status).toBe(401);
    });

    it("403 — rôle CLIENT non autorisé", async () => {
      const token = await loginAs("client@gmail.com");
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/veterinarian`)
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it("400 — body invalide", async () => {
      const token = await loginAs("directeur@gmail.com");
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/veterinarian`)
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it("201 — DIRECTOR crée un vétérinaire", async () => {
      const token = await loginAs("directeur@gmail.com");
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/veterinarian`)
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
        .post(`/api/clinics/${clinicId}/staffs/veterinarian`)
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

  // ── POST /api/clinics/${clinicId}/staffs/secretary ──────────────────────────────────────────────────

  describe("POST /api/clinics/${clinicId}/staffs/secretary", () => {
    it("401 — sans token", async () => {
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/secretary`)
        .send({});
      expect(res.status).toBe(401);
    });

    it("403 — rôle VETERINARIAN non autorisé", async () => {
      const token = await loginAs("veto@gmail.com");
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/secretary`)
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it("400 — body invalide", async () => {
      const token = await loginAs("directeur@gmail.com");
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/secretary`)
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it("201 — DIRECTOR crée une secrétaire", async () => {
      const token = await loginAs("directeur@gmail.com");
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/secretary`)
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

  // ── POST /api/clinics/${clinicId}/staffs/referent ────────────────────────────────────────────────

  describe("POST /api/clinics/${clinicId}/staffs/referent", () => {
    it("401 — sans token", async () => {
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/referent`)
        .send({});
      expect(res.status).toBe(401);
    });

    it("403 — REFERENT ne peut pas créer un autre référent", async () => {
      const token = await loginAs("referent@gmail.com");
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/referent`)
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it("400 — body invalide", async () => {
      const token = await loginAs("directeur@gmail.com");
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/referent`)
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it("201 — DIRECTOR crée un référent", async () => {
      const token = await loginAs("directeur@gmail.com");
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/referent`)
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

  // ── GET /api/clinics/${clinicId}/staffs/:id ────────────────────────────────────────────────────────

  describe("GET /api/clinics/${clinicId}/staffs/:id", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get(
        "/api/clinics/${clinicId}/staffs/some-id",
      );
      expect(res.status).toBe(401);
    });

    it("403 — rôle CLIENT non autorisé", async () => {
      const token = await loginAs("client@gmail.com");
      const res = await request(app)
        .get(`/api/clinics/${clinicId}/staffs/some-id`)
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
        .get(`/api/clinics/${clinicId}/staffs/${vetUser!.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id", vetUser!.id);
      expect(res.body).not.toHaveProperty("password");
    });
  });

  // ── GET /api/clinics/:clinicId/staffs/veterinarians/search ──────────────────

  describe("GET .../staffs/veterinarians/search", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get(
        `/api/clinics/${clinicId}/staffs/veterinarians/search?q=test`,
      );
      expect(res.status).toBe(401);
    });

    it("403 — rôle SECRETARY non autorisé", async () => {
      const res = await request(app)
        .get(`/api/clinics/${clinicId}/staffs/veterinarians/search?q=test`)
        .set("Authorization", `Bearer ${secretaryToken}`);
      expect(res.status).toBe(403);
    });

    it("400 — requête vide", async () => {
      const res = await request(app)
        .get(`/api/clinics/${clinicId}/staffs/veterinarians/search?q=`)
        .set("Authorization", `Bearer ${directorToken}`);
      expect(res.status).toBe(400);
    });

    it("200 — DIRECTOR trouve un vétérinaire par email", async () => {
      const res = await request(app)
        .get(
          `/api/clinics/${clinicId}/staffs/veterinarians/search?q=dr.moreau@vetparc.fr`,
        )
        .set("Authorization", `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── POST /api/clinics/:clinicId/staffs/veterinarians/link ───────────────────

  describe("POST .../staffs/veterinarians/link", () => {
    it("401 — sans token", async () => {
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/veterinarians/link`)
        .send({});
      expect(res.status).toBe(401);
    });

    it("403 — rôle VETERINARIAN non autorisé", async () => {
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/veterinarians/link`)
        .set("Authorization", `Bearer ${vetToken}`)
        .send({ veterinarianId: "00000000-0000-4000-8000-000000000000" });
      expect(res.status).toBe(403);
    });

    it("400 — body invalide", async () => {
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/veterinarians/link`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it("404 — vétérinaire introuvable", async () => {
      const res = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/veterinarians/link`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ veterinarianId: "00000000-0000-4000-8000-000000000000" });
      expect(res.status).toBe(404);
    });

    it("201 — DIRECTOR rattache un vétérinaire existant d'une autre clinique", async () => {
      const moreau = await getPrisma().user.findUnique({
        where: { email: "dr.moreau@vetparc.fr" },
      });

      const res = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/veterinarians/link`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({ veterinarianId: moreau!.id });

      expect(res.status).toBe(201);
    });
  });

  // ── DELETE /api/clinics/:clinicId/staffs/:id ─────────────────────────────────

  describe("DELETE .../staffs/:id", () => {
    it("401 — sans token", async () => {
      const res = await request(app).delete(
        `/api/clinics/${clinicId}/staffs/some-id`,
      );
      expect(res.status).toBe(401);
    });

    it("403 — rôle VETERINARIAN non autorisé", async () => {
      const res = await request(app)
        .delete(`/api/clinics/${clinicId}/staffs/some-id`)
        .set("Authorization", `Bearer ${vetToken}`);
      expect(res.status).toBe(403);
    });

    it("200 — DIRECTOR retire un vétérinaire de sa clinique (sans supprimer son compte)", async () => {
      const createRes = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/veterinarian`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({
          firstname: "A retirer",
          lastname: "Veto",
          email: uniqueEmail("a-retirer-veto"),
          password: "Password123!",
          licenseNumber: `LIC-DEL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        });
      expect(createRes.status).toBe(201);

      const res = await request(app)
        .delete(`/api/clinics/${clinicId}/staffs/${createRes.body.id}`)
        .set("Authorization", `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
    });

    it("200 — DIRECTOR supprime une secrétaire", async () => {
      const createRes = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/secretary`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({
          firstname: "A supprimer",
          lastname: "Secretaire",
          email: uniqueEmail("a-supprimer-sec"),
          password: "Password123!",
        });
      expect(createRes.status).toBe(201);

      const res = await request(app)
        .delete(`/api/clinics/${clinicId}/staffs/${createRes.body.id}`)
        .set("Authorization", `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
    });

    it("403 — un REFERENT ne peut pas supprimer un autre REFERENT", async () => {
      const createRes = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/referent`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({
          firstname: "Cible",
          lastname: "Referent",
          email: uniqueEmail("cible-ref"),
          password: "Password123!",
        });
      expect(createRes.status).toBe(201);

      const res = await request(app)
        .delete(`/api/clinics/${clinicId}/staffs/${createRes.body.id}`)
        .set("Authorization", `Bearer ${referentToken}`);

      expect(res.status).toBe(403);
    });

    it("200 — DIRECTOR peut supprimer un REFERENT", async () => {
      const createRes = await request(app)
        .post(`/api/clinics/${clinicId}/staffs/referent`)
        .set("Authorization", `Bearer ${directorToken}`)
        .send({
          firstname: "Cible2",
          lastname: "Referent",
          email: uniqueEmail("cible2-ref"),
          password: "Password123!",
        });
      expect(createRes.status).toBe(201);

      const res = await request(app)
        .delete(`/api/clinics/${clinicId}/staffs/${createRes.body.id}`)
        .set("Authorization", `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ── GET /api/clinics/:clinicId/staffs — filtrage par rôle ────────────────────

  describe("GET .../staffs?roles=...", () => {
    it("200 — filtre uniquement les vétérinaires", async () => {
      const res = await request(app)
        .get(`/api/clinics/${clinicId}/staffs?roles=VETERINARIAN`)
        .set("Authorization", `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(
        res.body.every((s: any) => s.role === "VETERINARIAN"),
      ).toBe(true);
    });
  });
});
