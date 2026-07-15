import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";

describe("Dashboard router", () => {
  let referentToken: string;
  let directorToken: string;
  let secretaryToken: string;
  let vetToken: string;
  let adminToken: string;
  let clientToken: string;

  beforeAll(async () => {
    referentToken = await loginAs("referent@gmail.com");
    directorToken = await loginAs("directeur@gmail.com");
    secretaryToken = await loginAs("secretaire@gmail.com");
    vetToken = await loginAs("veto@gmail.com");
    adminToken = await loginAs("admin@gmail.com");
    clientToken = await loginAs("client@gmail.com");
  });

  describe("GET /api/dashboard", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/dashboard");
      expect(res.status).toBe(401);
    });

    it("200 — CLIENT reçoit ses animaux, cliniques, RDV à venir et commandes", async () => {
      const res = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.role).toBe("CLIENT");
      expect(Array.isArray(res.body.animals)).toBe(true);
      expect(Array.isArray(res.body.clinics)).toBe(true);
      expect(res.body).toHaveProperty("upcomingMeetingsCount");
      expect(Array.isArray(res.body.upcomingMeetings)).toBe(true);
      expect(res.body).toHaveProperty("ordersInProgressCount");
      expect(Array.isArray(res.body.recentOrders)).toBe(true);
      expect(res.body).toHaveProperty("ordersReadyForPickupCount");
      expect(Array.isArray(res.body.ordersReadyForPickup)).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
    });

    it("200 — REFERENT reçoit la variante clinique (role: REFERENT)", async () => {
      const res = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${referentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.role).toBe("REFERENT");
      expect(res.body).toHaveProperty("clinic");
      expect(res.body).toHaveProperty("reviews");
      expect(res.body).toHaveProperty("sales");
    });

    it("200 — DIRECTOR reçoit la même variante clinique (role: DIRECTOR)", async () => {
      const res = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.role).toBe("DIRECTOR");
      expect(res.body).toHaveProperty("clinic");
      expect(res.body).toHaveProperty("reviews");
      expect(res.body).toHaveProperty("sales");
    });

    it("200 — SECRETARY reçoit commandes détaillées, RDV du jour et présence", async () => {
      const res = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${secretaryToken}`);

      expect(res.status).toBe(200);
      expect(res.body.role).toBe("SECRETARY");
      expect(res.body).toHaveProperty("ordersToPrepareCount");
      expect(res.body).toHaveProperty("ordersReadyForPickupCount");
      expect(Array.isArray(res.body.ordersToPrepare)).toBe(true);
      expect(Array.isArray(res.body.ordersReadyForPickup)).toBe(true);
      expect(res.body).toHaveProperty("todaysMeetingsCount");
      expect(Array.isArray(res.body.todaysMeetings)).toBe(true);
      expect(res.body).toHaveProperty("staff");
      expect(res.body.staff).toHaveProperty("veterinarianCount");
      expect(res.body.staff).toHaveProperty("secretaryCount");
      expect(Array.isArray(res.body.presentVeterinarians)).toBe(true);
    });

    it("200 — VETERINARIAN reçoit RDV détaillés, avis récents et patients", async () => {
      const res = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${vetToken}`);

      expect(res.status).toBe(200);
      expect(res.body.role).toBe("VETERINARIAN");
      expect(res.body).toHaveProperty("todaysMeetingsCount");
      expect(res.body).toHaveProperty("upcomingMeetingsCount");
      expect(Array.isArray(res.body.upcomingMeetings)).toBe(true);
      expect(res.body).toHaveProperty("rating");
      expect(res.body.rating).toHaveProperty("average");
      expect(res.body.rating).toHaveProperty("count");
      expect(Array.isArray(res.body.recentReviews)).toBe(true);
      expect(res.body).toHaveProperty("patientsCount");
    });

    it("200 — ADMIN reçoit la vue plateforme globale", async () => {
      const res = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.role).toBe("ADMIN");
      expect(res.body).toHaveProperty("clinicsCount");
      expect(res.body).toHaveProperty("usersCount");
      expect(res.body).toHaveProperty("pendingClinicRequestsCount");
      expect(res.body).toHaveProperty("pendingProductRequestsCount");
    });
  });
});