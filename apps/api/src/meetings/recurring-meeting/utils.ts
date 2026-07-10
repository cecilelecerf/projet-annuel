import { ClinicId, UserId } from "@armali/schemas";
import type {
  MeetingStatus,
  Prisma,
} from "../../../prisma/generated/prisma/client";

type InternalMeetingSource = {
  title: string;
  description?: string | null;
  adminId: UserId;
  clinicId: ClinicId;
  participants: { userId: UserId; status: MeetingStatus }[];
};

type AvailabilitySource = {
  userId: UserId;
  clinicId: ClinicId;
};

export function buildInternalMeetingCreate(
  source: InternalMeetingSource,
): Prisma.InternalMeetingCreateNestedOneWithoutMeetingInput {
  return {
    create: {
      title: source.title,
      description: source.description,
      adminId: source.adminId,
      clinicId: source.clinicId,
      participants: {
        create: source.participants.map((p) => ({
          user: { connect: { id: p.userId } },
          status: p.status,
        })),
      },
    },
  };
}

export function buildAvailabilityCreate(
  source: AvailabilitySource,
): Prisma.AvailabilityCreateNestedOneWithoutMeetingInput {
  return {
    create: {
      userId: source.userId,
      clinicId: source.clinicId,
    },
  };
}
