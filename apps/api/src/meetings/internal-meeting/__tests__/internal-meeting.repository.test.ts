import { ClinicId } from "@armali/schemas";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  internalMeetingParticipant: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

const { InternalMeetingParticipantRepository } =
  await import("../participant.repository");

const repository = new InternalMeetingParticipantRepository(mockPrisma as any);

beforeEach(() => vi.clearAllMocks());

const MEETING_ID = "internal-meeting-1";
const USER_ID = "user-1";

// ── findByKeys ───────────────────────────────────────────────────────────────

describe("InternalMeetingParticipantRepository.findByKeys", () => {
  it("interroge par la clé composite userId_meetingId", async () => {
    const participant = {
      userId: USER_ID,
      meetingId: MEETING_ID,
      status: "PENDING",
    };
    mockPrisma.internalMeetingParticipant.findUnique.mockResolvedValue(
      participant,
    );

    const result = await repository.findByKeys(MEETING_ID, USER_ID);

    expect(
      mockPrisma.internalMeetingParticipant.findUnique,
    ).toHaveBeenCalledWith({
      where: { userId_meetingId: { meetingId: MEETING_ID, userId: USER_ID } },
    });
    expect(result).toEqual(participant);
  });

  it("retourne null si le participant n'existe pas", async () => {
    mockPrisma.internalMeetingParticipant.findUnique.mockResolvedValue(null);

    const result = await repository.findByKeys(MEETING_ID, USER_ID);

    expect(result).toBeNull();
  });
});

// ── updateStatus ─────────────────────────────────────────────────────────────

describe("InternalMeetingParticipantRepository.updateStatus", () => {
  it("met à jour le statut via meetingId + userId", async () => {
    mockPrisma.internalMeetingParticipant.updateMany.mockResolvedValue({
      count: 1,
    });

    await repository.updateStatus({
      internalMeetingId: MEETING_ID,
      userId: USER_ID,
      status: "ACCEPTED",
    });

    expect(
      mockPrisma.internalMeetingParticipant.updateMany,
    ).toHaveBeenCalledWith({
      where: { meetingId: MEETING_ID, userId: USER_ID },
      data: { status: "ACCEPTED" },
    });
  });

  it("retourne le résultat brut de updateMany", async () => {
    mockPrisma.internalMeetingParticipant.updateMany.mockResolvedValue({
      count: 1,
    });

    const result = await repository.updateStatus({
      internalMeetingId: MEETING_ID,
      userId: USER_ID,
      status: "DECLINED",
    });

    expect(result).toEqual({ count: 1 });
  });
});

// ── copyStatus ───────────────────────────────────────────────────────────────

describe("InternalMeetingParticipantRepository.copyStatus", () => {
  it("construit un updateMany par participant source et les exécute dans une transaction", async () => {
    const sourceParticipants = [
      { userId: "user-1", status: "ACCEPTED" },
      { userId: "user-2", status: "PENDING" },
    ] as any;
    mockPrisma.$transaction.mockResolvedValue(undefined);

    await repository.copyStatus({
      targetInternalMeetingId: "target-meeting-1",
      sourceParticipants,
    });

    expect(
      mockPrisma.internalMeetingParticipant.updateMany,
    ).toHaveBeenCalledTimes(2);
    expect(
      mockPrisma.internalMeetingParticipant.updateMany,
    ).toHaveBeenNthCalledWith(1, {
      where: { meetingId: "target-meeting-1", userId: "user-1" },
      data: { status: "ACCEPTED" },
    });
    expect(
      mockPrisma.internalMeetingParticipant.updateMany,
    ).toHaveBeenNthCalledWith(2, {
      where: { meetingId: "target-meeting-1", userId: "user-2" },
      data: { status: "PENDING" },
    });
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockPrisma.$transaction).toHaveBeenCalledWith(
      expect.arrayContaining([expect.anything(), expect.anything()]),
    );
  });

  it("liste vide de participants — transaction appelée avec un tableau vide", async () => {
    mockPrisma.$transaction.mockResolvedValue(undefined);

    await repository.copyStatus({
      targetInternalMeetingId: "target-meeting-1",
      sourceParticipants: [],
    });

    expect(
      mockPrisma.internalMeetingParticipant.updateMany,
    ).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).toHaveBeenCalledWith([]);
  });
});

// ── findByUserAndClinicIds ─────────────────────────────────────────────────

describe("InternalMeetingParticipantRepository.findByUserAndClinicIds", () => {
  it("filtre uniquement par userId si ni dates ni clinicIds fournis", async () => {
    mockPrisma.internalMeetingParticipant.findMany.mockResolvedValue([]);

    await repository.findByUserAndClinicIds(USER_ID);

    expect(mockPrisma.internalMeetingParticipant.findMany).toHaveBeenCalledWith(
      {
        where: { userId: USER_ID },
        include: {
          meeting: {
            include: {
              meeting: {
                where: { parentId: null },
                include: {
                  internalMeeting: { include: { participants: true } },
                },
              },
            },
          },
        },
      },
    );
  });

  it("ajoute le filtre clinicId quand clinicIds est fourni", async () => {
    mockPrisma.internalMeetingParticipant.findMany.mockResolvedValue([]);

    await repository.findByUserAndClinicIds(USER_ID, undefined, undefined, [
      "clinic-1",
      "clinic-2",
    ] as ClinicId[]);

    const [args] = mockPrisma.internalMeetingParticipant.findMany.mock.calls[0];
    expect(args.where).toEqual({
      userId: USER_ID,
      meeting: { clinicId: { in: ["clinic-1", "clinic-2"] } },
    });
  });

  it("ajoute le sous-filtre recurring et le where sur meeting.meeting quand start/end sont fournis", async () => {
    mockPrisma.internalMeetingParticipant.findMany.mockResolvedValue([]);
    const start = new Date("2026-01-01T00:00:00.000Z");
    const end = new Date("2026-01-31T00:00:00.000Z");

    await repository.findByUserAndClinicIds(USER_ID, start, end);

    const [args] = mockPrisma.internalMeetingParticipant.findMany.mock.calls[0];
    expect(args.include.meeting.include).toHaveProperty("recurring");
    expect(args.include.meeting.include.meeting.where).toMatchObject({
      parentId: null,
      date: { gte: start, lte: end },
    });
  });

  it("n'ajoute pas de sous-filtre recurring si seul start est fourni (sans end)", async () => {
    mockPrisma.internalMeetingParticipant.findMany.mockResolvedValue([]);
    const start = new Date("2026-01-01T00:00:00.000Z");

    await repository.findByUserAndClinicIds(USER_ID, start, undefined);

    const [args] = mockPrisma.internalMeetingParticipant.findMany.mock.calls[0];
    expect(args.include.meeting.include).not.toHaveProperty("recurring");
    expect(args.include.meeting.include.meeting.where).toEqual({
      parentId: null,
    });
  });

  it("retourne le résultat brut de findMany", async () => {
    const rows = [{ userId: USER_ID, meetingId: MEETING_ID }];
    mockPrisma.internalMeetingParticipant.findMany.mockResolvedValue(rows);

    const result = await repository.findByUserAndClinicIds(USER_ID);

    expect(result).toEqual(rows);
  });
});
