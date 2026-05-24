import type { PrismaClient, Clinic } from "../generated/prisma/client";

export async function seedMeetings(
  prisma: PrismaClient,
  {
    users,
    clinic1,
    veterinarianClinics,
    specialities,
    healthConditions,
    pets,
    vaccines,
  }: {
    users: ReturnType<typeof import("./users").seedUsers> extends Promise<
      infer T
    >
      ? T
      : never;
    clinic1: Clinic;
    veterinarianClinics: ReturnType<
      typeof import("./veterinarian-clinics").seedVeterinarianClinics
    > extends Promise<infer T>
      ? T
      : never;
    specialities: ReturnType<
      typeof import("./specialities").seedSpecialities
    > extends Promise<infer T>
      ? T
      : never;
    healthConditions: ReturnType<
      typeof import("./health-conditions").seedHealthConditions
    > extends Promise<infer T>
      ? T
      : never;
    pets: ReturnType<typeof import("./pets").seedPets> extends Promise<infer T>
      ? T
      : never;
    vaccines: ReturnType<
      typeof import("./vaccines").seedVaccines
    > extends Promise<infer T>
      ? T
      : never;
  },
) {
  const {
    vetoUser1,
    vetoUser2,
    secretaryUser1,
    clientUser1,
    clientUser2,
    vetProfile1,
    vetProfile2,
    vetProfile3,
    secretaryProfile,
  } = users;
  const { vetoClinic1, vetoClinic2, vetoClinic3 } = veterinarianClinics;
  const { specCardio, specDerma } = specialities;
  const { conditionCardio, conditionRenal } = healthConditions;
  const { raceLab, racePersan, raceGolden } = pets;
  const { vaccineRage, vaccineCHPPi, vaccineTyphus } = vaccines;

  // ── Owned Pets ──────────────────────────────────────────────────────────────
  const ownedPet1 = await prisma.ownedPet.create({
    data: {
      name: "Rex",
      dateOfBirth: new Date("2020-03-10"),
      activity: 8,
      clientId: clientUser1.id,
      raceId: raceLab.id,
      attendingVeterinarianId: vetProfile1.id,
    },
  });
  const ownedPet2 = await prisma.ownedPet.create({
    data: {
      name: "Luna",
      dateOfBirth: new Date("2021-07-22"),
      activity: 5,
      clientId: clientUser1.id,
      raceId: racePersan.id,
    },
  });
  const ownedPet3 = await prisma.ownedPet.create({
    data: {
      name: "Max",
      dateOfBirth: new Date("2019-01-15"),
      activity: 6,
      clientId: clientUser2.id,
      raceId: raceGolden.id,
      attendingVeterinarianId: vetProfile2.id,
    },
  });

  // ── Disponibilités véto ─────────────────────────────────────────────────────
  const recurringAvail1 = await prisma.meetingReccuring.create({
    data: {
      dateStart: new Date("2026-01-01"),
      dateEnd: new Date("2026-09-30"),
      dayOfWeek: [1],
      startTime: new Date("1970-01-01T08:00:00Z"),
      endTime: new Date("1970-01-01T12:00:00Z"),
      kind: "AVAILABILITY",
      availabilty: {
        create: {
          userId: vetoClinic1.veterinarianId,
          clinicId: vetoClinic1.clinicId,
        },
      },
    },
  });
  // Exception sur le récurrent
  await prisma.meetingBase.create({
    data: {
      type: "EXCEPTION",
      kind: "AVAILABILITY",
      date: new Date("2026-03-09"),
      startTime: new Date("1970-01-01T08:00:00Z"),
      endTime: new Date("1970-01-01T12:00:00Z"),
      parentId: recurringAvail1.id,
      availabilty: {
        create: {
          userId: vetoClinic1.veterinarianId,
          clinicId: vetoClinic1.clinicId,
        },
      },
    },
  });

  await prisma.meetingReccuring.create({
    data: {
      dateStart: new Date("2026-01-01"),
      dateEnd: new Date("2026-09-30"),
      dayOfWeek: [3],
      startTime: new Date("1970-01-01T14:00:00Z"),
      endTime: new Date("1970-01-01T18:00:00Z"),
      kind: "AVAILABILITY",
      availabilty: {
        create: {
          userId: vetoClinic1.veterinarianId,
          clinicId: vetoClinic1.clinicId,
        },
      },
    },
  });

  await prisma.meetingBase.create({
    data: {
      type: "SPECIFIED",
      kind: "AVAILABILITY",
      date: new Date("2026-03-15"),
      startTime: new Date("1970-01-01T09:00:00Z"),
      endTime: new Date("1970-01-01T17:00:00Z"),
      availabilty: {
        create: {
          userId: vetoClinic1.veterinarianId,
          clinicId: vetoClinic1.clinicId,
        },
      },
    },
  });

  await prisma.meetingReccuring.create({
    data: {
      dateStart: new Date("2026-01-01"),
      dateEnd: new Date("2026-09-30"),
      dayOfWeek: [2],
      startTime: new Date("1970-01-01T09:00:00Z"),
      endTime: new Date("1970-01-01T13:00:00Z"),
      kind: "AVAILABILITY",
      availabilty: {
        create: {
          userId: vetoClinic2.veterinarianId,
          clinicId: vetoClinic2.clinicId,
        },
      },
    },
  });

  await prisma.meetingReccuring.create({
    data: {
      dateStart: new Date("2026-01-01"),
      dateEnd: new Date("2026-09-30"),
      dayOfWeek: [4],
      startTime: new Date("1970-01-01T09:00:00Z"),
      endTime: new Date("1970-01-01T18:00:00Z"),
      kind: "AVAILABILITY",
      availabilty: {
        create: {
          userId: vetoClinic2.veterinarianId,
          clinicId: vetoClinic2.clinicId,
        },
      },
    },
  });

  // ── Disponibilités secrétaire ───────────────────────────────────────────────
  const recurringSecAvail1 = await prisma.meetingReccuring.create({
    data: {
      dateStart: new Date("2026-01-01"),
      dateEnd: new Date("2026-09-30"),
      dayOfWeek: [1],
      startTime: new Date("1970-01-01T08:00:00Z"),
      endTime: new Date("1970-01-01T17:00:00Z"),
      kind: "AVAILABILITY",
      availabilty: {
        create: {
          userId: secretaryProfile.user.id,
          clinicId: secretaryProfile.clinicId,
        },
      },
    },
  });

  await prisma.meetingReccuring.create({
    data: {
      dateStart: new Date("2026-01-01"),
      dateEnd: new Date("2026-09-30"),
      dayOfWeek: [2],
      startTime: new Date("1970-01-01T08:00:00Z"),
      endTime: new Date("1970-01-01T17:00:00Z"),
      kind: "AVAILABILITY",
      availabilty: {
        create: {
          userId: secretaryProfile.user.id,
          clinicId: secretaryProfile.clinicId,
        },
      },
    },
  });

  await prisma.meetingBase.create({
    data: {
      type: "SPECIFIED",
      kind: "AVAILABILITY",
      date: new Date("2026-04-15"),
      startTime: new Date("1970-01-01T09:00:00Z"),
      endTime: new Date("1970-01-01T14:00:00Z"),
      availabilty: {
        create: {
          userId: secretaryProfile.user.id,
          clinicId: secretaryProfile.clinicId,
        },
      },
    },
  });

  await prisma.meetingBase.create({
    data: {
      type: "EXCEPTION",
      kind: "AVAILABILITY",
      date: new Date("2026-03-23"),
      startTime: new Date("1970-01-01T08:00:00Z"),
      endTime: new Date("1970-01-01T17:00:00Z"),
      parentId: recurringSecAvail1.id,
      availabilty: {
        create: {
          userId: secretaryProfile.user.id,
          clinicId: secretaryProfile.clinicId,
        },
      },
    },
  });

  // ── RDV animaux ─────────────────────────────────────────────────────────────
  const animalMeeting1 = await prisma.meetingBase.create({
    data: {
      type: "SPECIFIED",
      kind: "ANIMAL",
      date: new Date("2026-02-10"),
      startTime: new Date("1970-01-01T09:00:00Z"),
      endTime: new Date("1970-01-01T09:30:00Z"),
      animalMeeting: {
        create: {
          description: "Consultation de routine",
          petWeight: 28,
          petSize: 58,
          report:
            "Rex présente un souffle cardiaque léger. Surveillance recommandée.",
          specialityId: specCardio.id,
          ownedPetId: ownedPet1.id,
          veterinarianClinicId: vetoClinic1.id,
        },
      },
    },
    include: {
      animalMeeting: true,
    },
  });

  const animalMeeting2 = await prisma.meetingBase.create({
    data: {
      type: "SPECIFIED",
      kind: "ANIMAL",
      date: new Date("2026-03-05"),
      startTime: new Date("1970-01-01T14:00:00Z"),
      endTime: new Date("1970-01-01T14:20:00Z"),
      animalMeeting: {
        create: {
          description: "Problème de peau",
          petWeight: 4,
          petSize: 32,
          specialityId: specDerma.id,
          ownedPetId: ownedPet2.id,
          veterinarianClinicId: vetoClinic1.id,
        },
      },
    },
    include: {
      animalMeeting: true,
    },
  });

  await prisma.meetingBase.create({
    data: {
      type: "SPECIFIED",
      kind: "ANIMAL",
      date: new Date("2026-04-01"),
      startTime: new Date("1970-01-01T10:00:00Z"),
      endTime: new Date("1970-01-01T10:30:00Z"),
      animalMeeting: {
        create: {
          specialityId: specDerma.id,
          ownedPetId: ownedPet3.id,
          veterinarianClinicId: vetoClinic1.id,
        },
      },
    },
    include: {
      animalMeeting: true,
    },
  });

  // ── Réunions internes ───────────────────────────────────────────────────────
  const recurringInternal1 = await prisma.meetingReccuring.create({
    data: {
      dateStart: new Date("2026-01-01"),
      dateEnd: new Date("2026-09-30"),
      dayOfWeek: [1],
      startTime: new Date("1970-01-01T10:00:00Z"),
      endTime: new Date("1970-01-01T11:00:00Z"),
      kind: "INTERNAL",
      internalMeeting: {
        create: {
          title: "Réunion hebdomadaire équipe",
          description: "Point de la semaine",
          clinicId: clinic1.id,
          adminId: vetProfile1.id,
        },
      },
    },
    include: {
      internalMeeting: true,
    },
  });

  // Occurrence spécifique avec contenu différent
  await prisma.meetingBase.create({
    data: {
      type: "SPECIFIED",
      kind: "INTERNAL",
      date: new Date("2026-03-16"),
      startTime: new Date("1970-01-01T10:00:00Z"),
      endTime: new Date("1970-01-01T11:00:00Z"),
      parentId: recurringInternal1.id,
      internalMeeting: {
        create: {
          title: "Réunion hebdomadaire — bilan mensuel",
          description: "Bilan du mois de mars",
          clinicId: clinic1.id,
          adminId: vetProfile1.id,
        },
      },
    },
  });

  const baseInternal2 = await prisma.meetingBase.create({
    data: {
      type: "SPECIFIED",
      kind: "INTERNAL",
      date: new Date("2026-03-20"),
      startTime: new Date("1970-01-01T14:00:00Z"),
      endTime: new Date("1970-01-01T15:30:00Z"),
      internalMeeting: {
        create: {
          title: "Formation nouveaux équipements",
          description: "Présentation échographie",
          clinicId: clinic1.id,
          adminId: secretaryProfile.id,
        },
      },
    },
    include: {
      internalMeeting: true,
    },
  });

  await prisma.internalMeetingParticipant.createMany({
    data: [
      {
        meetingId: recurringInternal1.internalMeeting!.id,
        userId: vetoUser1.id,
        status: "ACCEPTED",
      },
      {
        meetingId: recurringInternal1.internalMeeting!.id,
        userId: vetoUser2.id,
        status: "ACCEPTED",
      },
      {
        meetingId: recurringInternal1.internalMeeting!.id,
        userId: secretaryUser1.id,
        status: "PENDING",
      },
      {
        meetingId: baseInternal2.internalMeeting!.id,
        userId: vetoUser1.id,
        status: "ACCEPTED",
      },
      {
        meetingId: baseInternal2.internalMeeting!.id,
        userId: vetoUser2.id,
        status: "DECLINED",
      },
    ],
  });

  // ── Health conditions owned pets ────────────────────────────────────────────
  await prisma.ownedPetHealthCondition.create({
    data: {
      notes: "Diagnostiqué lors de la consultation du 10 février",
      diagnosedAt: new Date("2026-02-10"),
      healthConditionId: conditionCardio.id,
      ownedPetId: ownedPet1.id,
      meetingId: animalMeeting1.animalMeeting?.id,
      addedById: vetoUser1.id,
    },
  });
  await prisma.ownedPetHealthCondition.create({
    data: {
      notes: "Déclaré par le propriétaire, à confirmer",
      diagnosedAt: new Date("2026-01-15"),
      healthConditionId: conditionRenal.id,
      ownedPetId: ownedPet3.id,
      addedById: clientUser2.id,
    },
  });

  return { animalMeeting1, animalMeeting2, ownedPet1, ownedPet2, ownedPet3 };
}
