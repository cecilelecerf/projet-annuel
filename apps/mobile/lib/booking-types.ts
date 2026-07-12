export type BookingAnimal = {
  id: string;
  name: string;
  race: {
    name: string;
    petId: string;
    pet: { name: string };
  };
};

export type Speciality = { id: string; name: string };

export type BookingClinic = {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  distanceKm: number;
  vetCount: number;
  specialities: string[];
  nextSlot: string | null;
};

export type BookingVet = {
  id: string;
  bio?: string | null;
  user: { firstname: string; lastname: string; avatarUrl?: string | null };
  specialities: { id: string; name: string }[];
};

export type BookingSlot = { date: string; startTime: string; endTime: string };

export const REASON_CHIPS = [
  "Consultation générale",
  "Vaccination",
  "Suivi post-opératoire",
  "Urgence",
  "Bilan de santé",
  "Autre",
] as const;
