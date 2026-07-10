import RRuleLib from "rrule";

const { RRule, RRuleSet } = RRuleLib;

import { RRULE_DAYS, RRULE_FREQ } from "./data";
import { FlatMeeting } from "./meeting.service";
import {
  AnimalMeeting,
  Availability,
  InternalMeeting,
} from "../../prisma/generated/prisma/client";
import { MeetingBaseWithSpecific, MeetingRecurringWithChildren } from "./type";

const isRecurring = (
  m: MeetingBaseWithSpecific | MeetingRecurringWithChildren,
): m is MeetingRecurringWithChildren => {
  return "dateStart" in m;
};

export const flattenBase = ({
  animalMeeting,
  internalMeeting,
  availabilty,
  ...rest
}: MeetingBaseWithSpecific): FlatMeeting => {
  if (animalMeeting) return { ...animalMeeting, ...rest };
  if (internalMeeting) return { ...internalMeeting, ...rest };
  if (availabilty) return { ...availabilty, ...rest };
  throw new Error(`MeetingBase ${rest.id} has no specific type`);
};

export const expandRecurring = ({
  reccuring,
  start,
  end,
}: {
  reccuring: MeetingRecurringWithChildren;
  start: Date;
  end: Date;
}) => {
  const exceptionDates = (reccuring.childrens ?? [])
    .filter((c) => c.type === "EXCEPTION")
    .map((c) => c.date!)
    .filter(Boolean);

  const overrideMap = (reccuring.childrens ?? [])
    .filter((c) => c.type === "SPECIFIED")
    .reduce<Record<string, MeetingBaseWithSpecific>>((acc, c) => {
      const dateStr = c.date?.toISOString().split("T")[0];
      if (dateStr) acc[dateStr] = c as MeetingBaseWithSpecific;
      return acc;
    }, {});
  const freq = RRULE_FREQ[reccuring.frequency];
  const rule = new RRule({
    freq,
    byweekday: reccuring.dayOfWeek.map((d) => RRULE_DAYS[d]),
    dtstart: new Date(
      reccuring.dateStart.toISOString().split("T")[0] + "T00:00:00.000Z",
    ),
    until: new Date(
      reccuring.dateEnd.toISOString().split("T")[0] + "T23:59:59.000Z",
    ),
  });
  const ruleSet = new RRuleSet();
  ruleSet.rrule(rule);
  exceptionDates.forEach((d) => ruleSet.exdate(d));

  const occurrences = ruleSet.between(start, end, true);

  const occurrenceDateStrs = new Set(
    occurrences.map((d) => d.toISOString().split("T")[0]),
  );

  const overrideOnlyDates = Object.keys(overrideMap).filter(
    (dateStr) => !occurrenceDateStrs.has(dateStr),
  );

  const allDates = [
    ...occurrences.map((d) => d.toISOString().split("T")[0]),
    ...overrideOnlyDates,
  ];
  return allDates.map((dateStr) => {
    if (overrideMap[dateStr]) {
      return flattenBase(overrideMap[dateStr]);
    }
    const date = new Date(dateStr + "T00:00:00.000Z");

    let t: AnimalMeeting | InternalMeeting | Availability | undefined;
    if (reccuring.animalMeeting) t = reccuring.animalMeeting;
    else if (reccuring.internalMeeting) t = reccuring.internalMeeting;
    else if (reccuring.availabilty) t = reccuring.availabilty;

    if (!t)
      throw new Error(
        `RecurringMeetingBase ${reccuring.id} has no specific type`,
      );
    return {
      ...t,
      id: reccuring.id,
      parentId: reccuring.id,
      createdAt: reccuring.createdAt,
      updatedAt: reccuring.updatedAt,
      startTime: reccuring.startTime,
      endTime: reccuring.endTime,
      kind: reccuring.kind,
      date,
      type: "SPECIFIED" as const,
    };
  });
};

export const expandAll = (
  flat: (MeetingBaseWithSpecific | MeetingRecurringWithChildren)[],
  start: Date,
  end: Date,
): FlatMeeting[] => {
  const recurrings: MeetingRecurringWithChildren[] = [];
  const nonRecurring: MeetingBaseWithSpecific[] = [];
  flat.forEach((item) => {
    if (isRecurring(item)) recurrings.push(item);
    else nonRecurring.push(item);
  });
  return [
    ...nonRecurring.map((m) => flattenBase(m)),
    ...recurrings.flatMap((m) => expandRecurring({ reccuring: m, start, end })),
  ];
};
