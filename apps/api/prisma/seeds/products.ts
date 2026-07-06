import type { PrismaClient, Clinic } from "../generated/prisma/client";

export async function seedProducts(
  prisma: PrismaClient,
  {
    clinics,
    healthConditions,
  }: {
    clinics: ReturnType<typeof import("./clinics").seedClinics> extends Promise<
      infer T
    >
      ? T
      : never;
    healthConditions: any;
  },
) {
  const { conditionCardio, conditionRenal } = healthConditions;

  const brandRoyal = await prisma.brand.create({
    data: { name: "Royal Canin", logo: "https://royalcanin.com/logo.png" },
  });
  const brandHills = await prisma.brand.create({
    data: { name: "Hill's", logo: "https://hillspet.com/logo.png" },
  });

  const productKibble1 = await prisma.product.create({
    data: {
      name: "Royal Canin Cardiac",
      qrCode: "RC-CARDIAC-001",
      brandId: brandRoyal.id,
      description: "Croquettes spéciales insuffisance cardiaque",
    },
  });
  const productKibble2 = await prisma.product.create({
    data: {
      name: "Hill's Renal",
      qrCode: "HILLS-RENAL-001",
      brandId: brandHills.id,
      description: "Croquettes pour insuffisance rénale",
    },
  });
  const productKibble3 = await prisma.product.create({
    data: {
      name: "Royal Canin Adult",
      qrCode: "RC-ADULT-001",
      brandId: brandRoyal.id,
      description: "Croquettes adulte standard",
    },
  });

  const food1 = await prisma.food.create({
    data: {
      caloriesPer100: 370,
      proteinPer100: 25.5,
      fatPercentage: 14.0,
      fiberPercentage: 5.5,
      moisturePercentage: 8.0,
      type: "KIBBLE",
      productId: productKibble1.id,
    },
  });
  const food2 = await prisma.food.create({
    data: {
      caloriesPer100: 340,
      proteinPer100: 18.0,
      fatPercentage: 11.0,
      fiberPercentage: 6.0,
      moisturePercentage: 8.5,
      type: "KIBBLE",
      productId: productKibble2.id,
    },
  });
  const food3 = await prisma.food.create({
    data: {
      caloriesPer100: 385,
      proteinPer100: 27.0,
      fatPercentage: 16.0,
      fiberPercentage: 4.5,
      moisturePercentage: 8.0,
      type: "KIBBLE",
      productId: productKibble3.id,
    },
  });

  await prisma.foodHealthCondition.createMany({
    data: [
      {
        foodId: food1.id,
        healthConditionId: conditionCardio.id,
        recommendation: "RECOMMENDED",
      },
      {
        foodId: food2.id,
        healthConditionId: conditionRenal.id,
        recommendation: "RECOMMENDED",
      },
      {
        foodId: food3.id,
        healthConditionId: conditionCardio.id,
        recommendation: "AVOID",
      },
      {
        foodId: food3.id,
        healthConditionId: conditionRenal.id,
        recommendation: "AVOID",
      },
    ],
  });

  const cp1 = await prisma.clinicProduct.create({
    data: {
      stock: 50,
      minimumRequired: 10,
      price: 65.9,
      clinicId: clinics.clinic1.id,
      productId: productKibble1.id,
    },
  });
  await prisma.clinicProduct.create({
    data: {
      stock: 30,
      minimumRequired: 5,
      price: 58.5,
      clinicId: clinics.clinic1.id,
      productId: productKibble2.id,
    },
  });
  await prisma.clinicProduct.create({
    data: {
      stock: 3,
      minimumRequired: 10,
      price: 45.0,
      clinicId: clinics.clinic2.id,
      productId: productKibble3.id,
    },
  });

  return { cp1 };
}
