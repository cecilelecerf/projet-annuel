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
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

const PARIS_TZ = "Europe/Paris";

// Formatte une Date en YYYY-MM-DD selon le calendrier de Paris,
// peu importe l'offset UTC réellement stocké.
export const toParisDateStr = (date: Date): string => {
  return dayjs(date).tz(PARIS_TZ).format("YYYY-MM-DD");
};

// Reconstruit un instant UTC-minuit à partir d'un jour Paris,
// pour ré-ancrer les dates avant de les passer à rrule (dtstart, until, exdate)
export const parisDateStrToUtcMidnight = (dateStr: string): Date => {
  return dayjs.utc(dateStr + "T00:00:00.000Z").toDate();
};
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
      const dateStr = c.date ? toParisDateStr(c.date) : undefined;
      if (dateStr) acc[dateStr] = c as MeetingBaseWithSpecific;
      return acc;
    }, {});

  const freq = RRULE_FREQ[reccuring.frequency];

  const rule = new RRule({
    freq,
    byweekday: reccuring.dayOfWeek.map((d) => RRULE_DAYS[d]),
    dtstart: parisDateStrToUtcMidnight(toParisDateStr(reccuring.dateStart)),
    until: dayjs
      .utc(toParisDateStr(reccuring.dateEnd) + "T23:59:59.000Z")
      .toDate(),
  });

  const ruleSet = new RRuleSet();
  ruleSet.rrule(rule);
  exceptionDates.forEach((d) =>
    ruleSet.exdate(parisDateStrToUtcMidnight(toParisDateStr(d))),
  );

  // Ici les dates sont good -> il manque juste les dates spécifiques

  // Bien normaliser aussi les bornes de la requête, sinon même souci côté start/end
  const occurrences = ruleSet.between(
    parisDateStrToUtcMidnight(toParisDateStr(start)),
    parisDateStrToUtcMidnight(toParisDateStr(end)),
    true,
  );

  const occurrenceDateStrs = new Set(occurrences.map((d) => toParisDateStr(d)));
  const overrideOnlyDates = Object.keys(overrideMap).filter(
    (dateStr) => !occurrenceDateStrs.has(dateStr),
  );

  const allDates = [
    ...occurrences.map((d) => toParisDateStr(d)),
    ...overrideOnlyDates,
  ];

  return allDates.map((dateStr) => {
    if (overrideMap[dateStr]) {
      const startTime = overrideMap[dateStr].startTime;
      const date = dayjs(overrideMap[dateStr].date)
        .set("hours", startTime.getHours())
        .set("minutes", startTime.getMinutes());
      return flattenBase({
        ...overrideMap[dateStr],
        date: date.tz(PARIS_TZ).toDate(),
      });
    }
    const date = parisDateStrToUtcMidnight(dateStr);

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
