import type { PrismaClient } from "../generated/prisma/client";
import type { seedUsers } from "./users";
type Users = Awaited<ReturnType<typeof seedUsers>>;
export declare function seedBankingInfo(prisma: PrismaClient, { users }: {
    users: Users;
}): Promise<void>;
export {};
//# sourceMappingURL=banking-info.d.ts.map