import { Meeting, MettingWithException } from "@schemas";

export class MettingService {
  expandRecurring({
    metting,
    start,
    end,
  }: {
    metting: MettingWithException;
    start: Date;
    end: Date;
  }) {
    const occurrences = [];
    const current = new Date(metting.dateStart!);

    // Dates des exceptions
    const exceptionDates = (metting.exceptions ?? [])
      .filter((e) => e.type === "EXCEPTION")
      .map((e) => e.specificDate?.toISOString().split("T")[0])
      .filter(Boolean);

    while (current <= end) {
      if (current >= start && current.getDay() === metting.dayOfWeek) {
        const dateStr = current.toISOString().split("T")[0];

        if (!exceptionDates.includes(dateStr)) {
          occurrences.push({
            ...metting,
            specificDate: new Date(current),
            dateStart: null,
            dateEnd: null,
            type: "SPECIFIED" as const,
          });
        }
      }
      current.setDate(current.getDate() + 1);
    }
    return occurrences;
  }
}
