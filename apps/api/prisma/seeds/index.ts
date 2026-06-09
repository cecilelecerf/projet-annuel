import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

import { seedClinics } from "./clinics";
import { seedUsers } from "./users";
import { seedPets } from "./pets";
import { seedSpecialities } from "./specialities";
import { seedVeterinarianClinics } from "./veterinarian-clinics";
import { seedMettings } from "./mettings";
import { seedHealthConditions } from "./health-conditions";
import { seedVaccines } from "./vaccines";
import { seedProducts } from "./products";
import { seedOrders } from "./orders";
import { seedMessaging } from "./messagging";
import { seedActs } from "./acts";
import { seedBankingInfo } from "./banking-info";
import { seedMedicalVisits } from "./medical-visit";

config({ path: resolve(process.cwd(), ".env") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

async function main() {
  const existingUser = await prisma.user.findUnique({
    where: { email: "admin@gmail.com" },
  });

  if (existingUser) {
    console.log("⏭️  Base de données déjà peuplée, seed ignoré.");
    return;
  }

  console.log("🌱 Seeding database...");

  const { clinic1, clinic2 } = await seedClinics(prisma);
  const users = await seedUsers(prisma, [clinic1, clinic2]);
  const medicalVisit = await seedMedicalVisits(prisma, { users });
  const bankingInfo = await seedBankingInfo(prisma, { users });
  const pets = await seedPets(prisma);
  const specialities = await seedSpecialities(prisma);
  const vaccines = await seedVaccines(prisma, pets);
  const vetoClinic = await seedVeterinarianClinics(prisma, {
    users,
    clinic1,
    clinic2,
  });
  const healthConditions = await seedHealthConditions(prisma, {
    petDog: pets.petDog,
  });
  const mettings = await seedMettings(prisma, {
    users,
    clinic1,
    veterinarianClinics: vetoClinic,
    specialities,
    healthConditions,
    vaccines,
    pets,
  });
  const acts = await seedActs(prisma, { clinic1, clinic2, mettings });
  await seedProducts(prisma, { clinic1, clinic2, healthConditions });
  await seedOrders(prisma, { users, clinic1 });
  await seedMessaging(prisma, { users });

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
