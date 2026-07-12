function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = dimanche ... 6 = samedi
  const diff = (day === 0 ? -6 : 1) - day; // décale vers le lundi précédent
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d;
}

function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export interface WeeklyCount {
  weekStart: string;
  count: number;
}

export function computeVisitsForecast(
  visitDates: Date[],
  weeksHistory: number,
  weeksForecast: number,
): { history: WeeklyCount[]; forecast: WeeklyCount[] } {
  const now = new Date();
  const currentWeekStart = startOfWeek(now);
  const firstWeekStart = addWeeks(currentWeekStart, -(weeksHistory - 1));

  const buckets = new Map<string, number>();
  for (let i = 0; i < weeksHistory; i++) {
    buckets.set(addWeeks(firstWeekStart, i).toISOString().slice(0, 10), 0);
  }

  for (const date of visitDates) {
    const key = startOfWeek(date).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const history: WeeklyCount[] = Array.from(buckets, ([weekStart, count]) => ({
    weekStart,
    count,
  }));

  const points = history.map((h, x) => ({ x, y: h.count }));
  const { slope, intercept } = linearRegression(points);

  const forecast: WeeklyCount[] = Array.from(
    { length: weeksForecast },
    (_, i) => {
      const x = weeksHistory + i;
      const predicted = Math.max(0, Math.round(intercept + slope * x));
      return {
        weekStart: addWeeks(currentWeekStart, i + 1).toISOString().slice(0, 10),
        count: predicted,
      };
    },
  );

  return { history, forecast };
}
