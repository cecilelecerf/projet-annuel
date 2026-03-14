import type { PrismaClient, Pet } from "../generated/prisma/client";
export declare function seedVaccines(prisma: PrismaClient, { petDog, petCat }: {
    petDog: Pet;
    petCat: Pet;
}): Promise<{
    vaccineRage: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        petId: string;
        recommendedAge: number;
        boosterInterval: number;
        mandatoryCountry: import("@prisma/client/runtime/client").JsonValue | null;
        recommendedCountry: import("@prisma/client/runtime/client").JsonValue | null;
    };
    vaccineCHPPi: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        petId: string;
        recommendedAge: number;
        boosterInterval: number;
        mandatoryCountry: import("@prisma/client/runtime/client").JsonValue | null;
        recommendedCountry: import("@prisma/client/runtime/client").JsonValue | null;
    };
    vaccineTyphus: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        petId: string;
        recommendedAge: number;
        boosterInterval: number;
        mandatoryCountry: import("@prisma/client/runtime/client").JsonValue | null;
        recommendedCountry: import("@prisma/client/runtime/client").JsonValue | null;
    };
}>;
//# sourceMappingURL=vaccines.d.ts.map