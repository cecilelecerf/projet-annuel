import type { PrismaClient } from "../generated/prisma/client";
import type { seedUsers } from "./users";
type Users = Awaited<ReturnType<typeof seedUsers>>;
export declare function seedMedicalVisits(prisma: PrismaClient, { users }: {
    users: Users;
}): Promise<void>;
export {};
//# sourceMappingURL=medical-visit.d.ts.map