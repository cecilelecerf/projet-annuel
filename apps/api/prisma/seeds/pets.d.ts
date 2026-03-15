import type { PrismaClient } from "../generated/prisma/client";
export declare function seedPets(prisma: PrismaClient): Promise<{
    petDog: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        picture: string | null;
        name: string;
    };
    petCat: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        picture: string | null;
        name: string;
    };
    petRabbit: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        picture: string | null;
        name: string;
    };
    raceLab: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        picture: string | null;
        name: string;
        petId: string;
    };
    raceGolden: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        picture: string | null;
        name: string;
        petId: string;
    };
    racePersan: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        picture: string | null;
        name: string;
        petId: string;
    };
}>;
//# sourceMappingURL=pets.d.ts.map