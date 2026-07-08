import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";

describe("Referent router", () => {
  let referentToken: string;
  let clientToken: string;
  let vetToken: string;

  beforeAll(async () => {
    referentToken = await loginAs("referent@gmail.com");
    clientToken = await loginAs("client@gmail.com");
    vetToken = await loginAs("veto@gmail.com");
  });

  describe("GET /api/referent/dashboard", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/referent/dashboard");
      expect(res.status).toBe(401);
    });

    it("403 — CLIENT n'a pas accès au dashboard référent", async () => {
      const res = await request(app)
        .get("/api/referent/dashboard")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });

    it("403 — VETERINARIAN n'a pas accès au dashboard référent", async () => {
      const res = await request(app)
        .get("/api/referent/dashboard")
        .set("Authorization", `Bearer ${vetToken}`);
      expect(res.status).toBe(403);
    });

    it("200 — REFERENT reçoit son dashboard complet", async () => {
      const res = await request(app)
        .get("/api/referent/dashboard")
        .set("Authorization", `Bearer ${referentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("clinic");
      expect(res.body.clinic).toHaveProperty("name");
      expect(res.body.clinic).toHaveProperty("veterinarianCount");
      expect(res.body.clinic).toHaveProperty("secretaryCount");

      expect(res.body).toHaveProperty("reviews");
      expect(res.body.reviews).toHaveProperty("average");
      expect(res.body.reviews).toHaveProperty("count");
      expect(Array.isArray(res.body.reviews.veterinarians)).toBe(true);

      expect(res.body).toHaveProperty("sales");
      expect(res.body.sales).toHaveProperty("totalRevenue");
      expect(res.body.sales).toHaveProperty("totalOrdersCount");
      expect(res.body.sales).toHaveProperty("recentOrdersCount");
      expect(res.body.sales).toHaveProperty("lowStockCount");
    });
  });
});