import type { PrismaClient, Clinic } from "../generated/prisma/client";
export declare function seedProducts(prisma: PrismaClient, { clinic1, clinic2, healthConditions, }: {
    clinic1: Clinic;
    clinic2: Clinic;
    healthConditions: any;
}): Promise<{
    cp1: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        price: import("@prisma/client/runtime/client").Decimal;
        clinicId: string;
        productId: string;
        stock: number;
        minimumRequired: number;
        clientProfileId: string | null;
    };
}>;
//# sourceMappingURL=products.d.ts.map