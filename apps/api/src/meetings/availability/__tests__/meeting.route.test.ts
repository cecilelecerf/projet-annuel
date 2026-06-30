import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
// import request from "supertest";
// import { app } from "@api/app";

// const validQuery = "startDate=2026-01-01&endDate=2026-12-31";

// const loginAs = async (email: string, password = "Password123!") => {
//   const res = await request(app)
//     .post("/api/auth/login")
//     .send({ email, password });
//   return res.body.accessToken as string;
// };

// // ── POST /api/meetings/availabilities ─────────────────────────────────────────
describe("", () => {
  it("", () => {});
});
// describe("POST /api/meetings/availabilities", () => {
//   it("401 — sans token", async () => {
//     const res = await request(app).post("/api/meetings/availabilities");
//     expect(res.status).toBe(401);
//   });

//   it("403 — rôle CLIENT non autorisé", async () => {
//     const token = await loginAs("client@gmail.com");
//     const res = await request(app)
//       .post("/api/meetings/availabilities")
//       .set("Authorization", `Bearer ${token}`)
//       .send({});
//     expect(res.status).toBe(403);
//   });

//   it("400 — body invalide", async () => {
//     const token = await loginAs("veto@gmail.com");
//     const res = await request(app)
//       .post("/api/meetings/availabilities")
//       .set("Authorization", `Bearer ${token}`)
//       .send({});
//     expect(res.status).toBe(400);
//   });
//   it("400 — heure de fin avant heure de début", async () => {
//     const token = await loginAs("veto@gmail.com");
//     const res = await request(app)
//       .post("/api/meetings/availabilities")
//       .set("Authorization", `Bearer ${token}`)
//       .send({
//         date: "2026-06-01",
//         startTime: "1970-01-01T09:00:00.000Z",
//         endTime: "1970-01-01T08:00:00.000Z",
//       });
//     expect(res.status).toBe(400);
//   });
//   it("201 — VETERINARIAN crée une disponibilité", async () => {
//     const token = await loginAs("veto@gmail.com");
//     const res = await request(app)
//       .post("/api/meetings/availabilities")
//       .set("Authorization", `Bearer ${token}`)
//       .send({
//         date: "2026-06-01",
//         startTime: "1970-01-01T09:00:00.000Z",
//         endTime: "1970-01-01T10:00:00.000Z",
//       });
//     expect(res.status).toBe(201);
//     expect(res.body).toHaveProperty("id");
//   });
//   it("201 — SECRETARY crée une disponibilité", async () => {
//     const token = await loginAs("secretaire@gmail.com");
//     const res = await request(app)
//       .post("/api/meetings/availabilities")
//       .set("Authorization", `Bearer ${token}`)
//       .send({
//         date: "2026-06-01",
//         startTime: "1970-01-01T09:00:00.000Z",
//         endTime: "1970-01-01T10:00:00.000Z",
//       });
//     expect(res.status).toBe(201);
//     expect(res.body).toHaveProperty("id");
//   });
// });

// // ── PATCH /api/meetings/availabilities/:id ────────────────────────────────────

// describe("PATCH /api/meetings/availabilities/:id", () => {
//   it("401 — sans token", async () => {
//     const res = await request(app).patch(
//       "/api/meetings/availabilities/some-id",
//     );
//     expect(res.status).toBe(401);
//   });

//   it("403 — rôle CLIENT non autorisé", async () => {
//     const token = await loginAs("client@gmail.com");
//     const res = await request(app)
//       .patch("/api/meetings/availabilities/some-id")
//       .set("Authorization", `Bearer ${token}`)
//       .send({});
//     expect(res.status).toBe(403);
//   });

//   it("200 — VETERINARIAN met à jour une disponibilité", async () => {
//     const token = await loginAs("veto@gmail.com");
//     const resAvailability = await request(app)
//       .post("/api/meetings/availabilities")
//       .set("Authorization", `Bearer ${token}`)
//       .send({
//         date: "2026-06-01",
//         startTime: "1970-01-01T09:00:00.000Z",
//         endTime: "1970-01-01T10:00:00.000Z",
//       });
//     const res = await request(app)
//       .patch(`/api/meetings/availabilities/${resAvailability!.body.id}`)
//       .set("Authorization", `Bearer ${token}`)
//       .send({
//         startTime: "1970-01-01T10:00:00.000Z",
//         endTime: "1970-01-01T11:00:00.000Z",
//       });
//     expect(res.status).toBe(200);
//   });
// });

// // ── DELETE /api/meetings/availabilities/:id ───────────────────────────────────

// describe("DELETE /api/meetings/availabilities/:id", () => {
//   it("401 — sans token", async () => {
//     const res = await request(app).delete(
//       "/api/meetings/availabilities/some-id",
//     );
//     expect(res.status).toBe(401);
//   });
//   it("404 — n'existe pas", async () => {
//     const token = await loginAs("veto@gmail.com");

//     const res = await request(app)
//       .delete(`/api/meetings/availabilities/notfound`)
//       .set("Authorization", `Bearer ${token}`);
//     expect(res.status).toBe(404);
//   });
//   it("204 — VETERINARIAN supprime une disponibilité", async () => {
//     const token = await loginAs("veto@gmail.com");

//     // Crée une dispo à supprimer pour ne pas altérer les autres tests
//     const created = await request(app)
//       .post("/api/meetings/availabilities")
//       .set("Authorization", `Bearer ${token}`)
//       .send({
//         date: "2026-07-01",
//         startTime: "1970-01-01T09:00:00.000Z",
//         endTime: "1970-01-01T10:00:00.000Z",
//       });
//     const res = await request(app)
//       .delete(`/api/meetings/availabilities/${created.body.id}`)
//       .set("Authorization", `Bearer ${token}`);
//     expect(res.status).toBe(204);
//   });
// });
