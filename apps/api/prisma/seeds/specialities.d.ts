import type { PrismaClient } from "../generated/prisma/client";
export declare function seedSpecialities(prisma: PrismaClient): Promise<{
    specCardio: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string;
    };
    specDerma: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string;
    };
}>;
//# sourceMappingURL=specialities.d.ts.map