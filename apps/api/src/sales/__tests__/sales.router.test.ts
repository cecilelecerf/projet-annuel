import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";

describe("Sales router", () => {
  let referentToken: string;
  let directorToken: string;
  let secretaryToken: string;
  let clientToken: string;

  beforeAll(async () => {
    referentToken = await loginAs("referent@gmail.com");
    directorToken = await loginAs("directeur@gmail.com");
    secretaryToken = await loginAs("secretaire@gmail.com");
    clientToken = await loginAs("client@gmail.com");
  });

  describe("GET /api/sales", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/sales");
      expect(res.status).toBe(401);
    });

    it("403 — SECRETARY n'a pas accès aux ventes", async () => {
      const res = await request(app)
        .get("/api/sales")
        .set("Authorization", `Bearer ${secretaryToken}`);
      expect(res.status).toBe(403);
    });

    it("403 — CLIENT n'a pas accès aux ventes", async () => {
      const res = await request(app)
        .get("/api/sales")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });

    it("200 — REFERENT reçoit son rapport de ventes", async () => {
      const res = await request(app)
        .get("/api/sales")
        .set("Authorization", `Bearer ${referentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("summary");
      expect(res.body.summary).toHaveProperty("totalRevenue");
      expect(res.body.summary).toHaveProperty("orderCount");
      expect(res.body.summary).toHaveProperty("averageOrderValue");
      expect(Array.isArray(res.body.revenueOverTime)).toBe(true);
      expect(Array.isArray(res.body.topProducts)).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
    });

    it("200 — DIRECTOR reçoit le rapport de ventes de sa clinique", async () => {
      const res = await request(app)
        .get("/api/sales")
        .set("Authorization", `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("summary");
    });

    it("200 — accepte les paramètres de période from/to", async () => {
      const res = await request(app)
        .get("/api/sales")
        .query({ from: "2026-01-01T00:00:00.000Z", to: "2026-12-31T23:59:59.000Z" })
        .set("Authorization", `Bearer ${referentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("summary");
    });
  });
});