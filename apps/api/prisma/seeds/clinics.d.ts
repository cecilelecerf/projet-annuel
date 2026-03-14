import type { PrismaClient } from "../generated/prisma/client";
export declare function seedClinics(prisma: PrismaClient): Promise<{
    clinic1: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        address: string;
        siret: string;
        phone: string;
        website: string;
    };
    clinic2: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        address: string;
        siret: string;
        phone: string;
        website: string;
    };
}>;
//# sourceMappingURL=clinics.d.ts.map