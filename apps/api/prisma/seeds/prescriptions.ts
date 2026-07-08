import type { PrismaClient } from "../generated/prisma/client";

export async function seedPrescriptions(
  prisma: PrismaClient,
  {
    meetings,
    products,
    users,
  }: {
    meetings: ReturnType<
      typeof import("./meetings").seedMeetings
    > extends Promise<infer T>
      ? T
      : never;
    products: ReturnType<
      typeof import("./products").seedProducts
    > extends Promise<infer T>
      ? T
      : never;
    users: ReturnType<typeof import("./users").seedUsers> extends Promise<
      infer T
    >
      ? T
      : never;
  },
) {
  const { animalMeeting1, animalMeeting2 } = meetings;
  const { cp1 } = products;
  const { vetProfile1 } = users;

  // ── Rex — Cardio (RDV du 10/02) ───────────────────────────────────────────
  await prisma.prescription.create({
    data: {
      startDate: new Date("2026-02-10"),
      endDate: new Date("2026-05-10"),
      status: "ACTIVE",

      notes:
        "Surveiller le poids hebdomadairement. Revenir en consultation si essoufflement.",
      animalMeetingId: animalMeeting1.animalMeeting!.id,
      veterinarianId: vetProfile1.id,
      items: {
        create: [
          {
            medicationName: "Furosémide 40mg",
            dosage: "1 comprimé",
            frequency: "2 fois par jour",
            duration: 90,
            instructions: "Donner le matin et le soir avec la nourriture",
            clinicProductId: cp1.id,
          },
          {
            medicationName: "Benazépril 5mg",
            dosage: "1/2 comprimé",
            frequency: "1 fois par jour",
            duration: 90,
            instructions: "Donner le soir",
          },
          {
            medicationName: "Royal Canin Cardiac",
            dosage: "200g",
            frequency: "2 fois par jour",
            duration: 90,
            instructions: "Remplacer les croquettes habituelles",
            clinicProductId: cp1.id,
          },
        ],
      },
    },
  });

  // ── Rex — Suivi cardiaque (prescription sans RDV associé directement) ──────
  await prisma.prescription.create({
    data: {
      startDate: new Date("2026-05-10"),
      endDate: new Date("2026-08-10"),
      status: "ACTIVE",
      notes:
        "Renouvellement du traitement cardiaque. Bonne tolérance observée.",
      animalMeetingId: animalMeeting1.animalMeeting!.id,
      veterinarianId: vetProfile1.id,
      items: {
        create: [
          {
            medicationName: "Furosémide 40mg",
            dosage: "1 comprimé",
            frequency: "2 fois par jour",
            duration: 90,
            instructions: "Continuer le traitement précédent",
            clinicProductId: cp1.id,
          },
          {
            medicationName: "Benazépril 5mg",
            dosage: "1/2 comprimé",
            frequency: "1 fois par jour",
            duration: 90,
          },
        ],
      },
    },
  });

  // ── Luna — Dermatologie (RDV du 05/03) ────────────────────────────────────
  await prisma.prescription.create({
    data: {
      startDate: new Date("2026-03-05"),
      endDate: new Date("2026-03-19"),
      status: "COMPLETED",
      notes:
        "Traitement court pour dermatite allergique. À renouveler si rechute.",
      animalMeetingId: animalMeeting2.animalMeeting!.id,
      veterinarianId: vetProfile1.id,
      items: {
        create: [
          {
            medicationName: "Prednisolone 5mg",
            dosage: "2 comprimés",
            frequency: "1 fois par jour",
            duration: 7,
            instructions:
              "Donner le matin à jeun. Diminuer la dose après 7 jours.",
          },
          {
            medicationName: "Cetirizine 10mg",
            dosage: "1/2 comprimé",
            frequency: "1 fois par jour",
            duration: 14,
            instructions: "Antihistaminique — donner le soir",
          },
          {
            medicationName: "Shampooing dermatologique",
            dosage: "1 application",
            frequency: "2 fois par semaine",
            duration: 14,
            instructions: "Laisser poser 5 minutes avant de rincer",
          },
        ],
      },
    },
  });

  // ── Luna — Suivi annulé ───────────────────────────────────────────────────
  await prisma.prescription.create({
    data: {
      startDate: new Date("2026-04-01"),
      status: "CANCELLED",
      notes: "Prescription annulée — animal guéri, pas de rechute.",
      animalMeetingId: animalMeeting2.animalMeeting!.id,
      veterinarianId: vetProfile1.id,
      items: {
        create: [
          {
            medicationName: "Prednisolone 5mg",
            dosage: "1 comprimé",
            frequency: "1 fois par jour",
            duration: 14,
          },
        ],
      },
    },
  });
}
