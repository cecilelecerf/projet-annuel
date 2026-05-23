import type { PrismaClient, Clinic } from "../generated/prisma/client";

export async function seedActs(
  prisma: PrismaClient,
  {
    clinic1,
    clinic2,
    meetings,
    users,
  }: {
    clinic1: Clinic;
    clinic2: Clinic;
    meetings: ReturnType<
      typeof import("./meetings").seedMeetings
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
  const { vetProfile1, vetProfile2 } = users;
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
  const actVaccination = await prisma.act.create({
    data: { name: "Vaccination", type: "VACCINATION", basePrice: 30 },
  });

  // ── Prix par clinique ───────────────────────────────────────────────────────
  const caCardioClinic1 = await prisma.clinicAct.create({
    data: { actId: actCardio.id, clinicId: clinic1.id, price: 70 },
  });
  const caEchoClinic1 = await prisma.clinicAct.create({
    data: { actId: actEcho.id, clinicId: clinic1.id, price: 95 },
  });
  const caBloodClinic1 = await prisma.clinicAct.create({
    data: { actId: actBlood.id, clinicId: clinic1.id, price: 50 },
  });
  const caXrayClinic1 = await prisma.clinicAct.create({
    data: { actId: actXray.id, clinicId: clinic1.id, price: 80 },
  });
  const caSurgeryClinic1 = await prisma.clinicAct.create({
    data: { actId: actSurgery.id, clinicId: clinic1.id, price: 195 },
  });
  const caHospClinic1 = await prisma.clinicAct.create({
    data: { actId: actHospitalization.id, clinicId: clinic1.id, price: 65 },
  });
  const caNursingClinic1 = await prisma.clinicAct.create({
    data: { actId: actNursing.id, clinicId: clinic1.id, price: 28 },
  });
  const caVaccClinic1 = await prisma.clinicAct.create({
    data: { actId: actVaccination.id, clinicId: clinic1.id, price: 32 },
  });

  await prisma.clinicAct.createMany({
    data: [
      { actId: actConsultation.id, clinicId: clinic2.id, price: 38 },
      { actId: actEcho.id, clinicId: clinic2.id, price: 88 },
      { actId: actBlood.id, clinicId: clinic2.id, price: 42 },
    ],
  });

  // ── Actes réalisés sur RDV 1 (Rex — cardiologie) ───────────────────────────
  const actCardioPerformed = await prisma.animalMeetingAct.create({
    data: {
      performedAt: new Date("2026-02-10T09:00:00Z"),
      priceApplied: 70,
      animalMeetingId: animalMeeting1.animalMeeting?.id!,
      clinicActId: caCardioClinic1.id,
      performedBy: {
        create: [{ veterinarianId: vetProfile1.id }],
      },
    },
  });

  const actEchoPerformed = await prisma.animalMeetingAct.create({
    data: {
      performedAt: new Date("2026-02-10T09:10:00Z"),
      priceApplied: 95,
      notes: "Échographie cardiaque — légère dilatation ventriculaire gauche",
      animalMeetingId: animalMeeting1.animalMeeting?.id!,
      clinicActId: caEchoClinic1.id,
      performedBy: {
        create: [{ veterinarianId: vetProfile1.id }],
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

  const actBloodPerformed = await prisma.animalMeetingAct.create({
    data: {
      performedAt: new Date("2026-02-10T09:20:00Z"),
      priceApplied: 50,
      animalMeetingId: animalMeeting1.animalMeeting?.id!,
      clinicActId: caBloodClinic1.id,
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

  // ── Actes réalisés sur RDV 2 (Luna — dermatologie) ─────────────────────────
  await prisma.animalMeetingAct.create({
    data: {
      performedAt: new Date("2026-03-05T14:00:00Z"),
      priceApplied: 80,
      notes: "Radiographie thoracique de contrôle",
      animalMeetingId: animalMeeting2.animalMeeting?.id!,
      clinicActId: caXrayClinic1.id,
      performedBy: {
        create: [{ veterinarianId: vetProfile1.id }],
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

  await prisma.animalMeetingAct.create({
    data: {
      performedAt: new Date("2026-03-05T14:10:00Z"),
      priceApplied: 28,
      animalMeetingId: animalMeeting2.animalMeeting?.id!,
      clinicActId: caNursingClinic1.id,
      performedBy: {
        create: [{ veterinarianId: vetProfile1.id }],
      },
    },
  });

  return { actCardioPerformed, actEchoPerformed, actBloodPerformed };
}
