import type { PrismaClient, Pet } from "../generated/prisma/client";
export declare function seedHealthConditions(prisma: PrismaClient, { petDog }: {
    petDog: Pet;
}): Promise<{
    conditionRenal: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string;
        petId: string;
    };
    conditionCardio: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string;
        petId: string;
    };
}>;
//# sourceMappingURL=health-conditions.d.ts.map