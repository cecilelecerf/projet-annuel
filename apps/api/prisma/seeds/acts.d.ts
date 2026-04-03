import type { PrismaClient, Clinic } from "../generated/prisma/client";
export declare function seedActs(prisma: PrismaClient, { clinic1, clinic2, mettings, }: {
    clinic1: Clinic;
    clinic2: Clinic;
    mettings: any;
}): Promise<{
    actCardioPerformed: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        performedAt: Date;
        notes: string | null;
        priceApplied: import("@prisma/client/runtime/client").Decimal;
        animalMettingId: string;
        clinicActId: string;
    };
    actEchoPerformed: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        performedAt: Date;
        notes: string | null;
        priceApplied: import("@prisma/client/runtime/client").Decimal;
        animalMettingId: string;
        clinicActId: string;
    };
    actBloodPerformed: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        performedAt: Date;
        notes: string | null;
        priceApplied: import("@prisma/client/runtime/client").Decimal;
        animalMettingId: string;
        clinicActId: string;
    };
}>;
//# sourceMappingURL=acts.d.ts.map