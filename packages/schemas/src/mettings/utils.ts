export const timeRefineFn = (data: {
  startTime?: unknown;
  endTime?: unknown;
}) => {
  if (!data.startTime || !data.endTime) return true;
  return new Date(data.startTime as string) < new Date(data.endTime as string);
};

export const timeRefineOptions = {
  message: "L'heure de début doit être avant l'heure de fin",
  path: ["endTime"],
};
