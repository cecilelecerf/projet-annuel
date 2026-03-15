import type { PrismaClient, Clinic } from "../generated/prisma/client";
export declare function seedMettings(prisma: PrismaClient, { users, clinic1, veterinarianClinics, specialities, healthConditions, pets, vaccines, }: {
    users: ReturnType<typeof import("./users").seedUsers> extends Promise<infer T> ? T : never;
    clinic1: Clinic;
    veterinarianClinics: ReturnType<typeof import("./veterinarian-clinics").seedVeterinarianClinics> extends Promise<infer T> ? T : never;
    specialities: ReturnType<typeof import("./specialities").seedSpecialities> extends Promise<infer T> ? T : never;
    healthConditions: ReturnType<typeof import("./health-conditions").seedHealthConditions> extends Promise<infer T> ? T : never;
    pets: ReturnType<typeof import("./pets").seedPets> extends Promise<infer T> ? T : never;
    vaccines: ReturnType<typeof import("./vaccines").seedVaccines> extends Promise<infer T> ? T : never;
}): Promise<{
    animalMeeting1: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("../generated/prisma/enums").ScheduleType;
        dayOfWeek: number | null;
        dateStart: Date | null;
        dateEnd: Date | null;
        startTime: Date | null;
        endTime: Date | null;
        specificDate: Date | null;
        parentId: string | null;
        kind: import("../generated/prisma/enums").MettingKind;
    };
    animalMeeting2: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("../generated/prisma/enums").ScheduleType;
        dayOfWeek: number | null;
        dateStart: Date | null;
        dateEnd: Date | null;
        startTime: Date | null;
        endTime: Date | null;
        specificDate: Date | null;
        parentId: string | null;
        kind: import("../generated/prisma/enums").MettingKind;
    };
    ownedPet1: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        dateOfBirth: Date;
        activity: number | null;
        attendingVeterinarianId: string | null;
        clientId: string;
        raceId: string;
    };
    ownedPet2: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        dateOfBirth: Date;
        activity: number | null;
        attendingVeterinarianId: string | null;
        clientId: string;
        raceId: string;
    };
    ownedPet3: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        dateOfBirth: Date;
        activity: number | null;
        attendingVeterinarianId: string | null;
        clientId: string;
        raceId: string;
    };
}>;
//# sourceMappingURL=mettings.d.ts.map