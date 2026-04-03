import type { PrismaClient, Clinic } from "../generated/prisma/client";
export declare function seedOrders(prisma: PrismaClient, { users, clinic1 }: {
    users: any;
    clinic1: Clinic;
}): Promise<{
    order1: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clinicId: string;
        status: import("../generated/prisma/enums").OrderStatus;
        clientId: string;
        pickupAt: Date | null;
    };
} | undefined>;
//# sourceMappingURL=orders.d.ts.map