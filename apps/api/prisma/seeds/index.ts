import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

import { seedClinics } from "./clinics";
import { seedUsers } from "./users";
import { seedPets } from "./pets";
import { seedSpecialities } from "./specialities";
import { seedVeterinarianClinics } from "./veterinarian-clinics";
import { seedHealthConditions } from "./health-conditions";
import { seedProducts } from "./products";
import { seedOrders } from "./orders";
import { seedMessaging } from "./messagging";
import { seedActs } from "./acts";
import { seedBankingInfo } from "./banking-info";
import { seedMedicalVisits } from "./medical-visit";
import { seedMeetings } from "./meetings";
import { seedPrescriptions } from "./prescriptions";
import { cleanup } from "./cleanup";
import { seedClinicRequests } from "./clinic-requests";
import { seedDirectors } from "./directors";
import { seedReviews } from "./reviews";
import { seedBudgetAndSuppliers } from "./budget";
import { seedAnalyses, seedImaging } from "./files";

config({ path: resolve(process.cwd(), ".env") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

async function main() {
  await cleanup(prisma);
  // const existingUser = await prisma.user.findUnique({
  //   where: { email: "admin@gmail.com" },
  // });

  // if (existingUser) {
  //   console.log("⏭️  Base de données déjà peuplée, seed ignoré.");
  //   return;
  // }

  console.log("🌱 Seeding database...");

  const specialities = await seedSpecialities(prisma);
  const pets = await seedPets(prisma);
  const directors = await seedDirectors(prisma);

  await seedClinicRequests(prisma, { directors });

  const clinics = await seedClinics(prisma, {
    specialities,
    pets,
    directors,
  });
  const users = await seedUsers(prisma, {
    clinics,
    specialities,
    pets,
  });
  await seedMedicalVisits(prisma, { users });
  await seedBankingInfo(prisma, { users });
  const vetoClinic = await seedVeterinarianClinics(prisma, {
    users,
    clinics,
  });
  const healthConditions = await seedHealthConditions(prisma, {
    petDog: pets.petDog,
  });
  const meetings = await seedMeetings(prisma, {
    users,
    clinics,
    veterinarianClinics: vetoClinic,
    specialities,
    healthConditions,
    pets,
    directors,
  });
  const acts = await seedActs(prisma, {
    petCat: pets.petCat,
    petDog: pets.petDog,
    clinics,
    meetings,
  });
  const imagingActs = acts.allPerformedActs.filter(
    (act) => act.type === "IMAGING",
  );
  const analysisActs = acts.allPerformedActs.filter(
    (act) => act.type === "ANALYSIS",
  );

  Promise.all([
    ...imagingActs.map(async (act, i) => {
      await seedImaging(prisma, {
        imagingIds: imagingActs.map((act) => act.id),
        localImagePath: `assets/imagings/imagings-${i}.jpg`,
      });
    }),
    ...analysisActs.map(async (act, i) => {
      await seedAnalyses(prisma, {
        analysisIds: analysisActs.map((act) => act.id),
        localImagePath: `assets/analysiss/analyse-${i}.pdf`,
      });
    }),
  ]);

  const products = await seedProducts(prisma, {
    clinics,
    healthConditions,
  });
  await seedPrescriptions(prisma, { meetings, products, users });
  await seedOrders(prisma, { users, clinics });
  await seedMessaging(prisma, { users, clinics, directors });
  await seedReviews(prisma, { users, veterinarianClinics: vetoClinic });
  await seedBudgetAndSuppliers(prisma, { clinics });
  console.log("✅ Seed terminé avec succès !");
  console.log("\n📋 Comptes créés :");
  console.log("  Admin      : admin@gmail.com / Password123!");
  console.log("  Directeur  : directeur@gmail.com / Password123!");
  console.log("  Référant   : referent@gmail.com / Password123!");
  console.log("  Véto 1     : veto@gmail.com / Password123!");
  console.log("  Véto 2     : dr.moreau@vetparc.fr / Password123!");
  console.log("  Véto 3     : dr.garcia@vetsaintmichel.fr / Password123!");
  console.log("  Secrétaire : secretaire@gmail.com / Password123!");
  console.log("  Client 1   : client@gmail.com / Password123!");
  console.log("  Client 2   : thomas.blanc@email.fr / Password123!");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
