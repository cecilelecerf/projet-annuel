import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";

describe("Budget router", () => {
  let referentToken: string;
  let directorToken: string;
  let clientToken: string;

  beforeAll(async () => {
    referentToken = await loginAs("referent@gmail.com");
    directorToken = await loginAs("directeur@gmail.com");
    clientToken = await loginAs("client@gmail.com");
  });

  describe("GET /api/budget", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/budget");
      expect(res.status).toBe(401);
    });

    it("403 — CLIENT n'a pas accès au budget", async () => {
      const res = await request(app)
        .get("/api/budget")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });

    it("200 — REFERENT reçoit solde + historique", async () => {
      const res = await request(app)
        .get("/api/budget")
        .set("Authorization", `Bearer ${referentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("balance");
      expect(Array.isArray(res.body.transactions)).toBe(true);
    });

    it("200 — DIRECTOR reçoit le budget de sa clinique", async () => {
      const res = await request(app)
        .get("/api/budget")
        .set("Authorization", `Bearer ${directorToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/budget/credit", () => {
    it("403 — CLIENT ne peut pas créditer", async () => {
      const res = await request(app)
        .post("/api/budget/credit")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ amount: 100 });
      expect(res.status).toBe(403);
    });

    it("400 — body invalide (amount négatif)", async () => {
      const res = await request(app)
        .post("/api/budget/credit")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ amount: -50 });
      expect(res.status).toBe(400);
    });

    it("201 — REFERENT crédite le budget, le solde augmente en conséquence", async () => {
      const before = await request(app)
        .get("/api/budget")
        .set("Authorization", `Bearer ${referentToken}`);
      const balanceBefore = before.body.balance;

      const res = await request(app)
        .post("/api/budget/credit")
        .set("Authorization", `Bearer ${referentToken}`)
        .send({ amount: 100, reason: "Test" });

      expect(res.status).toBe(201);

      const after = await request(app)
        .get("/api/budget")
        .set("Authorization", `Bearer ${referentToken}`);
      expect(after.body.balance).toBe(balanceBefore + 100);
    });
  });
});