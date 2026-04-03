import type { PrismaClient, Clinic } from "../generated/prisma/client";
export declare function seedVeterinarianClinics(prisma: PrismaClient, { users, clinic1, clinic2 }: {
    users: any;
    clinic1: Clinic;
    clinic2: Clinic;
}): Promise<{
    vetoClinic1: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clinicId: string;
        veterinarianId: string;
    };
    vetoClinic2: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clinicId: string;
        veterinarianId: string;
    };
    vetoClinic3: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clinicId: string;
        veterinarianId: string;
    };
}>;
//# sourceMappingURL=veterinarian-clinics.d.ts.map