import { describe, it, expect, vi, beforeEach } from "vitest";

// const mockMeetingRepository = vi.hoisted(() => ({
//   getInternalMeetings: vi.fn(),
//   getAnimalMeetingsAsVet: vi.fn(),
//   getAnimalMeetingsAsClient: vi.fn(),
//   getAvailabilities: vi.fn(),
//   getAvailabilitiesByClinic: vi.fn(),
//   getMeetingById: vi.fn(),
//   getRecurringById: vi.fn(),
// }));

// vi.mock("@api/meetings/meeting.repository", () => ({
//   MeetingRepository: vi.fn(function () {
//     return mockMeetingRepository;
//   }),
// }));

// const { MeetingService } = await import("@api/meetings/meeting.service");
// const meetingService = new MeetingService();

// // ── Fixtures ──────────────────────────────────────────────────────────────────

// const start = new Date("2026-01-01T00:00:00.000Z");
// const end = new Date("2026-01-31T00:00:00.000Z");

// const makeBase = (overrides = {}) => ({
//   id: "base-1",
//   createdAt: new Date(),
//   updatedAt: new Date(),
//   type: "SPECIFIED" as const,
//   kind: "ANIMAL" as const,
//   startTime: new Date("1970-01-01T08:00:00.000Z"),
//   endTime: new Date("1970-01-01T09:00:00.000Z"),
//   date: new Date("2026-01-10T00:00:00.000Z"),
//   recurringId: null,
//   animalMeeting: null,
//   internalMeeting: null,
//   availabilty: null,
//   ...overrides,
// });

// const makeRecurring = (overrides = {}) => ({
//   id: "recurring-1",
//   createdAt: new Date(),
//   updatedAt: new Date(),
//   kind: "ANIMAL" as const,
//   dateStart: new Date("2026-01-01T00:00:00.000Z"),
//   dateEnd: new Date("2026-01-31T00:00:00.000Z"),
//   dayOfWeek: [1],
//   startTime: new Date("1970-01-01T08:00:00.000Z"),
//   endTime: new Date("1970-01-01T09:00:00.000Z"),
//   frequency: "WEEKLY" as const,
//   animalMeeting: null,
//   internalMeeting: null,
//   availabilty: null,
//   childrens: [],
//   ...overrides,
// });

// const makeAvailabilitySpecific = (overrides = {}) => ({
//   id: "avail-1",
//   userId: "user-1",
//   veterinarianClinicId: null,
//   recurringId: null,
//   meetingId: "base-1",
//   ...overrides,
// });

// const makeBaseWithAvailability = (overrides = {}) =>
//   makeBase({
//     kind: "AVAILABILITY" as const,
//     availabilty: makeAvailabilitySpecific(),
//     ...overrides,
//   });

// const makeRecurringWithAvailability = (overrides = {}) =>
//   makeRecurring({
//     kind: "AVAILABILITY" as const,
//     availabilty: makeAvailabilitySpecific({
//       meetingId: null,
//       recurringId: "recurring-1",
//     }),
//     ...overrides,
//   });

// beforeEach(() => vi.clearAllMocks());

// // ── getAvailabilities ─────────────────────────────────────────────────────────
describe("", () => {
  it("", () => {});
});
// describe("MeetingService.getAvailabilities", () => {
//   it("retourne un tableau vide si aucune disponibilité", async () => {
//     mockMeetingRepository.getAvailabilities.mockResolvedValue([]);

//     const result = await meetingService.getAvailabilities({
//       userId: "user-1",
//       start,
//       end,
//     });

//     expect(result).toHaveLength(0);
//   });

//   it("retourne les disponibilités ponctuelles aplaties", async () => {
//     mockMeetingRepository.getAvailabilities.mockResolvedValue([
//       {
//         ...makeAvailabilitySpecific(),
//         recurring: null,
//         meeting: makeBaseWithAvailability(),
//       },
//     ]);

//     const result = await meetingService.getAvailabilities({
//       userId: "user-1",
//       start,
//       end,
//     });

//     expect(result.length).toBeGreaterThan(0);
//     result.forEach((r) => expect(r.kind).toBe("AVAILABILITY"));
//   });

//   it("expand les disponibilités récurrentes", async () => {
//     mockMeetingRepository.getAvailabilities.mockResolvedValue([
//       {
//         ...makeAvailabilitySpecific(),
//         recurring: makeRecurringWithAvailability({ dayOfWeek: [3] }), // mercredi
//         meeting: null,
//       },
//     ]);

//     const result = await meetingService.getAvailabilities({
//       userId: "user-1",
//       start,
//       end,
//     });

//     // mercredis de janvier 2026 : 7, 14, 21, 28
//     expect(result).toHaveLength(4);
//   });
// });

// // ── getAvailabilitiesByClinic ─────────────────────────────────────────────────

// describe("MeetingService.getAvailabilitiesByClinic", () => {
//   it("retourne un tableau vide si aucune disponibilité", async () => {
//     mockMeetingRepository.getAvailabilitiesByClinic.mockResolvedValue([]);

//     const result = await meetingService.getAvailabilitiesByClinic({
//       clinicId: "clinic-1",
//       start,
//       end,
//     });

//     expect(result).toHaveLength(0);
//   });

//   it("retourne les disponibilités de la clinique aplaties", async () => {
//     mockMeetingRepository.getAvailabilitiesByClinic.mockResolvedValue([
//       {
//         ...makeAvailabilitySpecific(),
//         recurring: null,
//         meeting: makeBaseWithAvailability(),
//       },
//     ]);

//     const result = await meetingService.getAvailabilitiesByClinic({
//       clinicId: "clinic-1",
//       start,
//       end,
//     });

//     expect(result.length).toBeGreaterThan(0);
//   });

//   it("expand les disponibilités récurrentes par clinique", async () => {
//     mockMeetingRepository.getAvailabilitiesByClinic.mockResolvedValue([
//       {
//         ...makeAvailabilitySpecific(),
//         recurring: makeRecurringWithAvailability({ dayOfWeek: [4] }), // jeudi
//         meeting: null,
//       },
//     ]);

//     const result = await meetingService.getAvailabilitiesByClinic({
//       clinicId: "clinic-1",
//       start,
//       end,
//     });

//     // jeudis de janvier 2026 : 1, 8, 15, 22, 29
//     expect(result).toHaveLength(5);
//   });
// });
