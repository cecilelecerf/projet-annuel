import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.router.test";
import { getPrisma } from "../../../../__tests__/setup";

dayjs.extend(utc);

const makeTime = (hhmm: string) =>
  dayjs.utc(`1970-01-01T${hhmm}:00.000Z`).toDate();

describe("Recurring meeting router", () => {
  let vetToken: string;
  let directorToken: string;
  let clientToken: string;
  let vetUserId: string;
  let clinicId: string;
  let seededRecurringId: string;

  beforeAll(async () => {
    vetToken = await loginAs("veto@gmail.com");
    directorToken = await loginAs("directeur@gmail.com");
    clientToken = await loginAs("client@gmail.com");

    const prisma = getPrisma();

    const vetUser = await prisma.user.findUnique({
      where: { email: "veto@gmail.com" },
    });
    if (!vetUser) throw new Error("Utilisateur veto@gmail.com introuvable");
    vetUserId = vetUser.id;

    const availability = await prisma.availability.findFirst({
      where: { userId: vetUserId, recurringId: { not: null } },
      include: { recurring: true },
    });
    if (!availability?.recurring)
      throw new Error(
        "Aucune disponibilité récurrente seedée pour ce vétérinaire",
      );
    seededRecurringId = availability.recurring.id;
    clinicId = availability.clinicId;
  });

  describe("GET /api/meetings/recurrings/:id", () => {
    it("200 — VETERINARIAN reçoit la récurrence", async () => {
      const res = await request(app)
        .get(`/api/meetings/recurrings/${seededRecurringId}`)
        .set("Authorization", `Bearer ${vetToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(seededRecurringId);
    });

    it("200 — DIRECTOR reçoit la récurrence", async () => {
      const res = await request(app)
        .get(`/api/meetings/recurrings/${seededRecurringId}`)
        .set("Authorization", `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
    });

    it("404 — récurrence inexistante", async () => {
      const res = await request(app)
        .get("/api/meetings/recurrings/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${vetToken}`);

      expect(res.status).toBe(404);
    });

    it("401 — sans token", async () => {
      const res = await request(app).get(
        `/api/meetings/recurrings/${seededRecurringId}`,
      );
      expect(res.status).toBe(401);
    });

    it("403 — CLIENT n'est pas staff", async () => {
      const res = await request(app)
        .get(`/api/meetings/recurrings/${seededRecurringId}`)
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/meetings/recurrings/:id — permissions", () => {
    it("401 — sans token", async () => {
      const res = await request(app)
        .patch(`/api/meetings/recurrings/${seededRecurringId}`)
        .send({});
      expect(res.status).toBe(401);
    });

    it("403 — CLIENT n'est pas staff", async () => {
      const res = await request(app)
        .patch(`/api/meetings/recurrings/${seededRecurringId}`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send({});
      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/meetings/recurrings/:id — comportement fonctionnel", () => {
    const createDisposableRecurring = async () => {
      const prisma = getPrisma();
      return prisma.meetingReccuring.create({
        data: {
          dateStart: dayjs.utc("2027-06-01").toDate(),
          dateEnd: dayjs.utc("2027-12-31").toDate(),
          frequency: "WEEKLY",
          dayOfWeek: [1],
          startTime: makeTime("09:00"),
          endTime: makeTime("10:00"),
          kind: "AVAILABILITY",
          availabilty: {
            create: { userId: vetUserId, clinicId },
          },
        },
        include: { availabilty: true, internalMeeting: true },
      });
    };

    it("200 — modification en place quand dateToStartAction <= dateStart", async () => {
      const prisma = getPrisma();
      const disposable = await createDisposableRecurring();

      try {
        const res = await request(app)
          .patch(`/api/meetings/recurrings/${disposable.id}`)
          .set("Authorization", `Bearer ${vetToken}`)
          .send({
            dateToStartAction: "2027-06-01",
            startTime: "1970-01-01T08:00:00.000Z",
          });

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(disposable.id);

        const count = await prisma.meetingReccuring.count({
          where: {
            OR: [{ id: disposable.id }],
          },
        });
        expect(count).toBe(1);
      } finally {
        await prisma.meetingReccuring.delete({ where: { id: disposable.id } });
      }
    });

    it("200 — split de série quand dateToStartAction > dateStart (nouvelle série créée)", async () => {
      const prisma = getPrisma();
      const disposable = await createDisposableRecurring();
      let newRecurringId: string | undefined;

      try {
        const res = await request(app)
          .patch(`/api/meetings/recurrings/${disposable.id}`)
          .set("Authorization", `Bearer ${vetToken}`)
          .send({
            dateToStartAction: "2027-07-01",
            startTime: "1970-01-01T14:00:00.000Z",
          });

        expect(res.status).toBe(200);
        expect(res.body.id).not.toBe(disposable.id);
        newRecurringId = res.body.id;

        const oldRecurring = await prisma.meetingReccuring.findUnique({
          where: { id: disposable.id },
        });
        expect(oldRecurring?.dateEnd).toEqual(dayjs.utc("2027-06-30").toDate());
      } finally {
        if (newRecurringId) {
          await prisma.meetingReccuring.delete({
            where: { id: newRecurringId },
          });
        }
        await prisma.meetingReccuring.delete({ where: { id: disposable.id } });
      }
    });
  });
});
