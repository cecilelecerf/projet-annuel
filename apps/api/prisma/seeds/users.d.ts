import type { Clinic, PrismaClient } from "../generated/prisma/client";
export declare function seedUsers(prisma: PrismaClient, clinics: Clinic[]): Promise<{
    adminUser: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        lastname: string;
        firstname: string;
        picture: string | null;
        role: import("../generated/prisma/enums").UserRole;
        password: string;
    };
    directorUser1: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        lastname: string;
        firstname: string;
        picture: string | null;
        role: import("../generated/prisma/enums").UserRole;
        password: string;
    };
    directorUser2: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        lastname: string;
        firstname: string;
        picture: string | null;
        role: import("../generated/prisma/enums").UserRole;
        password: string;
    };
    referentUser1: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        lastname: string;
        firstname: string;
        picture: string | null;
        role: import("../generated/prisma/enums").UserRole;
        password: string;
    };
    vetoUser1: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        lastname: string;
        firstname: string;
        picture: string | null;
        role: import("../generated/prisma/enums").UserRole;
        password: string;
    };
    vetoUser2: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        lastname: string;
        firstname: string;
        picture: string | null;
        role: import("../generated/prisma/enums").UserRole;
        password: string;
    };
    vetoUser3: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        lastname: string;
        firstname: string;
        picture: string | null;
        role: import("../generated/prisma/enums").UserRole;
        password: string;
    };
    vetProfile1: {
        id: string;
        licenseNumber: string;
        bio: string | null;
    };
    vetProfile2: {
        id: string;
        licenseNumber: string;
        bio: string | null;
    };
    vetProfile3: {
        id: string;
        licenseNumber: string;
        bio: string | null;
    };
    secretaryUser1: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        lastname: string;
        firstname: string;
        picture: string | null;
        role: import("../generated/prisma/enums").UserRole;
        password: string;
    };
    clientUser1: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        lastname: string;
        firstname: string;
        picture: string | null;
        role: import("../generated/prisma/enums").UserRole;
        password: string;
    };
    clientUser2: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        lastname: string;
        firstname: string;
        picture: string | null;
        role: import("../generated/prisma/enums").UserRole;
        password: string;
    };
    clientProfile1: {
        id: string;
        address: string | null;
        phone: string | null;
        dateOfBirth: Date;
        secretaryProfileId: string | null;
    };
    clientProfile2: {
        id: string;
        address: string | null;
        phone: string | null;
        dateOfBirth: Date;
        secretaryProfileId: string | null;
    };
}>;
//# sourceMappingURL=users.d.ts.map