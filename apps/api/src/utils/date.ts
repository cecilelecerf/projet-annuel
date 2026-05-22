export const calculateAge = (
  dateOfBirth: Date,
): { years: number; months: number } => {
  const now = new Date();
  const birth = new Date(dateOfBirth);

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months };
};

export const formatAge = (dateOfBirth: Date): string => {
  const { years, months } = calculateAge(dateOfBirth);

  if (years === 0) return `${months} mois`;
  if (months === 0) return `${years} an${years > 1 ? "s" : ""}`;
  return `${years} an${years > 1 ? "s" : ""} et ${months} mois`;
};
