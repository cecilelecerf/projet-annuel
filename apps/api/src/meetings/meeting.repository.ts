import { MeetingKind } from "../../prisma/generated/prisma/enums";
import { Prisma } from "../../prisma/generated/prisma/client";
import { PrismaClient } from "../../prisma/generated/prisma/client";

export const recurringFilter = (start: Date, end: Date) => ({
  dateStart: { lte: end },
  dateEnd: { gte: start },
});

export const baseFilter = (start: Date, end: Date) => ({
  date: { gte: start, lte: end },
});

// ── Include réutilisé pour "récurrence + occurrences enfants" ──────────────
export const recurringWithChildrenInclude = (start: Date, end: Date) =>
  ({
    internalMeeting: { include: { participants: true } },
    availabilty: { include: { clinic: true } },
    childrens: {
      where: baseFilter(start, end),
      include: {
        internalMeeting: { include: { participants: true } },
        availabilty: { include: { clinic: true } },
      },
    },
  }) satisfies Prisma.MeetingReccuringInclude;

export type RecurringWithChildren = Prisma.MeetingReccuringGetPayload<{
  include: ReturnType<typeof recurringWithChildrenInclude>;
}>;

// ═══════════════════════════════════════════════════════════════
// Includes par méthode — définis en fonction de (start, end) car
// le `where` imbriqué en dépend (n'affecte pas la forme du type)
// ═══════════════════════════════════════════════════════════════

const meetingByIdInclude = {
  animalMeeting: true,
  internalMeeting: { include: { participants: true } },
  availabilty: { include: { clinic: true } },
  parent: true,
} satisfies Prisma.MeetingBaseInclude;

export type MeetingWithDetails = Prisma.MeetingBaseGetPayload<{
  include: typeof meetingByIdInclude;
}>;

// ═══════════════════════════════════════════════════════════════
// Repository
// ═══════════════════════════════════════════════════════════════

export class MeetingRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<MeetingWithDetails | null> {
    return this.prisma.meetingBase.findUnique({
      where: { id },
      include: meetingByIdInclude,
    });
  }

  // TODO : pas le bon repo

  async createException({
    parentId,
    date,
    kind,
    startTime,
    endTime,
  }: {
    parentId: string;
    date: Date;
    kind: MeetingKind;
    startTime: Date;
    endTime: Date;
  }): Promise<Prisma.MeetingBaseGetPayload<object>> {
    return this.prisma.meetingBase.create({
      data: {
        type: "EXCEPTION",
        date,
        startTime,
        endTime,
        kind,
        parentId,
      },
    });
  }
}
