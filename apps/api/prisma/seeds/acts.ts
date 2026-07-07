import type { PrismaClient, Pet } from "../generated/prisma/client";

export async function seedActs(
  prisma: PrismaClient,
  {
    petCat,
    petDog,
    clinics,
    meetings,
  }: {
    petDog: Pet;
    petCat: Pet;
    clinics: ReturnType<typeof import("./clinics").seedClinics> extends Promise<
      infer T
    >
      ? T
      : never;
    meetings: ReturnType<
      typeof import("./meetings").seedMeetings
    > extends Promise<infer T>
      ? T
      : never;
  },
) {
  const { animalMeeting1, animalMeeting2 } = meetings;

  // ── Catalogue d'actes ───────────────────────────────────────────────────────
  const actConsultation = await prisma.act.create({
    data: {
      name: "Consultation générale",
      type: "CONSULTATION",
      basePrice: 35,
    },
  });
  const actCardio = await prisma.act.create({
    data: {
      name: "Consultation cardiologie",
      type: "CONSULTATION",
      basePrice: 65,
      description: "Auscultation + ECG",
    },
  });
  const actEcho = await prisma.act.create({
    data: {
      name: "Échographie",
      type: "IMAGING",
      basePrice: 90,
      description: "Échographie abdominale ou cardiaque",
    },
  });
  const actXray = await prisma.act.create({
    data: { name: "Radiographie", type: "IMAGING", basePrice: 75 },
  });
  const actBlood = await prisma.act.create({
    data: {
      name: "Prise de sang",
      type: "ANALYSIS",
      basePrice: 45,
      description: "NFS + biochimie",
    },
  });
  const actSurgery = await prisma.act.create({
    data: {
      name: "Stérilisation",
      type: "SURGERY",
      basePrice: 180,
      description: "Castration ou ovariectomie",
    },
  });
  const actHospitalization = await prisma.act.create({
    data: {
      name: "Hospitalisation (par jour)",
      type: "HOSPITALIZATION",
      basePrice: 60,
    },
  });
  const actNursing = await prisma.act.create({
    data: { name: "Soins infirmiers", type: "NURSING", basePrice: 25 },
  });
  const actRageVaccination = await prisma.act.create({
    data: {
      name: "Rage",
      description: "Vaccin antirabique obligatoire",
      type: "VACCINATION",
      basePrice: 30,
      vaccine: {
        create: {
          recommendedAge: 12,
          boosterInterval: 52,
          petId: petDog.id,
          countryRules: {
            create: [
              { country: "FR", minAge: 12, type: "MANDATORY" },
              { country: "BE", minAge: 16, type: "MANDATORY" },
              { country: "CH", minAge: 12, type: "RECOMMENDED" },
            ],
          },
        },
      },
    },
  });
  const actCHPPRIVaccination = await prisma.act.create({
    data: {
      name: "CHPPi",
      description: "Maladie de Carré, Hépatite, Parvovirose, Parainfluenza",
      type: "VACCINATION",
      basePrice: 30,
      vaccine: {
        create: {
          recommendedAge: 8,
          boosterInterval: 52,
          petId: petDog.id,
          countryRules: {
            create: [
              { country: "FR", minAge: 12, type: "MANDATORY" },
              { country: "BE", minAge: 16, type: "MANDATORY" },
              { country: "CH", minAge: 12, type: "RECOMMENDED" },
            ],
          },
        },
      },
    },
  });

  const actTyphusVaccination = await prisma.act.create({
    data: {
      name: "Typhus",
      description: "Panleucopénie féline",
      type: "VACCINATION",
      basePrice: 30,
      vaccine: {
        create: {
          recommendedAge: 8,
          boosterInterval: 52,
          petId: petCat.id,
          countryRules: {
            create: [
              { country: "FR", minAge: 12, type: "MANDATORY" },
              { country: "BE", minAge: 16, type: "MANDATORY" },
              { country: "CH", minAge: 12, type: "RECOMMENDED" },
            ],
          },
        },
      },
    },
  });

  // ── Prix par clinique ───────────────────────────────────────────────────────
  await prisma.clinicAct.create({
    data: { actId: actCardio.id, clinicId: clinics.clinic1.id, price: 70 },
  });
  const caEchoClinic1 = await prisma.clinicAct.create({
    data: { actId: actEcho.id, clinicId: clinics.clinic1.id, price: 95 },
  });
  const caBloodClinic1 = await prisma.clinicAct.create({
    data: { actId: actBlood.id, clinicId: clinics.clinic1.id, price: 50 },
  });
  const caXrayClinic1 = await prisma.clinicAct.create({
    data: { actId: actXray.id, clinicId: clinics.clinic1.id, price: 80 },
  });
  await prisma.clinicAct.create({
    data: { actId: actSurgery.id, clinicId: clinics.clinic1.id, price: 195 },
  });
  await prisma.clinicAct.create({
    data: {
      actId: actHospitalization.id,
      clinicId: clinics.clinic1.id,
      price: 65,
    },
  });
  const caNursingClinic1 = await prisma.clinicAct.create({
    data: { actId: actNursing.id, clinicId: clinics.clinic1.id, price: 28 },
  });
  const caVaccClinic1 = await prisma.clinicAct.create({
    data: {
      actId: actCHPPRIVaccination.id,
      clinicId: clinics.clinic1.id,
      price: 32,
    },
    include: { act: true },
  });

  await prisma.clinicAct.createMany({
    data: [
      { actId: actConsultation.id, clinicId: clinics.clinic2.id, price: 38 },
      { actId: actEcho.id, clinicId: clinics.clinic2.id, price: 88 },
      { actId: actBlood.id, clinicId: clinics.clinic2.id, price: 42 },
    ],
  });

  // ── Actes réalisés sur RDV 1 (Rex — cardiologie) ───────────────────────────

  await prisma.animalMedicalHistory.create({
    data: {
      performedAt: animalMeeting1.date,
      animalMeetingId: animalMeeting1.animalMeeting!.id!,
      animalId: animalMeeting1.animalMeeting!.animalId,
      performedBy: {
        connect: [{ id: animalMeeting1.animalMeeting!.veterinarianClinicId! }],
      },
      priceApplied: 70,
      type: "VACCINATION",
      clinicActId: caVaccClinic1.id,
      actId: caVaccClinic1.actId,
      animalVaccine: {
        create: {
          animalId: animalMeeting1.animalMeeting!.animalId,
          vaccineId: caVaccClinic1.act.vaccineId!,
        },
      },
    },
  });

  // ── Actes réalisés sur RDV 1 (Rex — cardiologie) ───────────────────────────

  // Échographie cardiaque
  const actEchoPerformed = await prisma.animalMedicalHistory.create({
    data: {
      performedAt: animalMeeting1.date,
      priceApplied: 95,
      notes: "Échographie cardiaque — légère dilatation ventriculaire gauche",
      type: "IMAGING",
      actId: actEcho.id,
      clinicActId: caEchoClinic1.id,
      animalMeetingId: animalMeeting1.animalMeeting!.id,
      animalId: animalMeeting1.animalMeeting!.animalId,
      performedBy: {
        connect: [{ id: animalMeeting1.animalMeeting!.veterinarianClinicId! }],
      },
      imaging: {
        create: {
          imagingType: "ULTRASOUND",
          bodyPart: "Cœur",
          findings: "Dilatation ventriculaire gauche légère, FEVG conservée",
          fileUrl: "https://storage.vetparc.fr/echo-rex-20260210.pdf",
        },
      },
    },
  });

  // Prise de sang
  const actBloodPerformed = await prisma.animalMedicalHistory.create({
    data: {
      performedAt: animalMeeting1.date,
      priceApplied: 50,
      type: "ANALYSIS",
      actId: actBlood.id,
      clinicActId: caBloodClinic1.id,
      animalMeetingId: animalMeeting1.animalMeeting!.id,
      animalId: animalMeeting1.animalMeeting!.animalId,
      performedBy: {
        connect: [{ id: animalMeeting1.animalMeeting!.veterinarianClinicId! }],
      },
      analysis: {
        create: {
          analysisType: "BLOOD",
          status: "RECEIVED",
          receivedAt: new Date("2026-02-11T14:00:00Z"),
          fileUrl: "https://storage.vetparc.fr/blood-rex-20260210.pdf",
          interpretation:
            "Légère élévation des troponines cardiaques. Surveillance recommandée.",
        },
      },
    },
  });

  // Vaccination Rage (historique externe — sans clinicAct, sans meeting)
  await prisma.animalMedicalHistory.create({
    data: {
      performedAt: new Date("2025-03-15"),
      type: "VACCINATION",
      actId: actRageVaccination.id,
      animalId: animalMeeting1.animalMeeting!.animalId,
      notes: "Vaccin antirabique effectué chez un autre vétérinaire",
      animalVaccine: {
        create: {
          animalId: animalMeeting1.animalMeeting!.animalId,
          vaccineId: actRageVaccination.vaccineId!,
        },
      },
    },
  });

  // ── Actes réalisés sur RDV 2 (Luna — dermatologie) ─────────────────────────

  // Radiographie thoracique
  await prisma.animalMedicalHistory.create({
    data: {
      performedAt: animalMeeting2.date,
      priceApplied: 80,
      notes: "Radiographie thoracique de contrôle",
      type: "IMAGING",
      actId: actXray.id,
      clinicActId: caXrayClinic1.id,
      animalMeetingId: animalMeeting2.animalMeeting!.id,
      animalId: animalMeeting2.animalMeeting!.animalId,
      performedBy: {
        connect: [{ id: animalMeeting2.animalMeeting!.veterinarianClinicId! }],
      },
      imaging: {
        create: {
          imagingType: "XRAY",
          bodyPart: "Thorax",
          findings: "Pas d'anomalie visible",
          fileUrl: "https://storage.vetparc.fr/xray-luna-20260305.pdf",
        },
      },
    },
  });

  // Soins infirmiers
  await prisma.animalMedicalHistory.create({
    data: {
      performedAt: animalMeeting2.date,
      priceApplied: 28,
      type: "NURSING",
      actId: actNursing.id,
      clinicActId: caNursingClinic1.id,
      animalMeetingId: animalMeeting2.animalMeeting!.id,
      animalId: animalMeeting2.animalMeeting!.animalId,
      performedBy: {
        connect: [{ id: animalMeeting2.animalMeeting!.veterinarianClinicId! }],
      },
      notes: "Nettoyage et désinfection des plaies cutanées",
    },
  });

  // Vaccination Typhus (historique Luna)
  await prisma.animalMedicalHistory.create({
    data: {
      performedAt: new Date("2024-06-10"),
      type: "VACCINATION",
      actId: actTyphusVaccination.id,
      animalId: animalMeeting2.animalMeeting!.animalId,
      notes: "Vaccin typhus effectué chez un autre vétérinaire",
      animalVaccine: {
        create: {
          animalId: animalMeeting2.animalMeeting!.animalId,
          vaccineId: actTyphusVaccination.vaccineId!,
        },
      },
    },
  });

  return { actEchoPerformed, actBloodPerformed };
}
