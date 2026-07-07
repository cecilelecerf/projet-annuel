import type { PrismaClient } from "../generated/prisma/client";

export async function seedSpecialities(prisma: PrismaClient) {
  const specialities = await Promise.all([
    prisma.speciality.create({
      data: {
        name: "Médecine générale",
        description: "Consultations et soins courants pour tous animaux",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Cardiologie",
        description: "Maladies cardiaques et vasculaires",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Dermatologie",
        description: "Maladies de la peau, du pelage et des muqueuses",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Chirurgie",
        description: "Interventions chirurgicales générales et orthopédiques",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Neurologie",
        description: "Maladies du système nerveux central et périphérique",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Oncologie",
        description: "Diagnostic et traitement des cancers animaux",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Ophtalmologie",
        description: "Maladies des yeux et de la vision",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Dentisterie",
        description: "Soins dentaires, détartrage et extractions",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Orthopédie",
        description: "Troubles musculo-squelettiques et fractures",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Endocrinologie",
        description: "Maladies hormonales comme le diabète et l'hypothyroïdie",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Gastroentérologie",
        description: "Maladies digestives, foie et pancréas",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Néphrologie & Urologie",
        description: "Maladies des reins, vessie et voies urinaires",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Pneumologie",
        description: "Maladies respiratoires et pulmonaires",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Reproduction & Obstétrique",
        description: "Reproduction, gestation, mise bas et stérilisation",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Médecine interne",
        description: "Diagnostics complexes et maladies systémiques",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Urgences & Soins intensifs",
        description: "Prise en charge des urgences vitales",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Comportement animal",
        description: "Troubles comportementaux et thérapies associées",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Médecine des NAC",
        description:
          "Soins spécialisés pour les nouveaux animaux de compagnie (lapins, oiseaux, reptiles...)",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Acupuncture & Médecines douces",
        description: "Médecines alternatives et complémentaires",
      },
    }),
    prisma.speciality.create({
      data: {
        name: "Imagerie médicale",
        description: "Radiologie, échographie et scanner",
      },
    }),
  ]);

  const [
    medecineGenerale,
    cardiologie,
    dermatologie,
    chirurgie,
    neurologie,
    oncologie,
    ophtalmologie,
    dentisterie,
    orthopedie,
    endocrinologie,
    gastroenterologie,
    nephrologieUrologie,
    pneumologie,
    reproductionObstetrique,
    medecineInterne,
    urgencesSoinsIntensifs,
    comportementAnimal,
    medecineNAC,
    acupuncture,
    imageriemédicale,
  ] = specialities;

  return {
    medecineGenerale,
    cardiologie,
    dermatologie,
    chirurgie,
    neurologie,
    oncologie,
    ophtalmologie,
    dentisterie,
    orthopedie,
    endocrinologie,
    gastroenterologie,
    nephrologieUrologie,
    pneumologie,
    reproductionObstetrique,
    medecineInterne,
    urgencesSoinsIntensifs,
    comportementAnimal,
    medecineNAC,
    acupuncture,
    imageriemédicale,
  };
}
