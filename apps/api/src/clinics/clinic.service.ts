import { prisma } from "@api/lib/prisma";
import { UpdateClinic } from "@armali/schemas";
import { BadRequestError, NotFoundError } from "@api/errors";

export class ClinicService {
  async getMyClinic(userId: string) {
    const director = await prisma.directorClinicProfile.findUnique({
      where: { id: userId },
      include: { clinic: true },
    });
    if (director) return director.clinic;

    const referent = await prisma.referentClinicProfile.findUnique({
      where: { id: userId },
      include: { clinic: true },
    });
    if (referent) return referent.clinic;

    const vetClinic = await prisma.veterinarianClinic.findFirst({
      where: { veterinarianId: userId },
      include: { clinic: true },
    });
    if (vetClinic) return vetClinic.clinic;

    const secretary = await prisma.secretaryProfile.findUnique({
      where: { id: userId },
      include: { clinic: true },
    });
    if (secretary) return secretary.clinic;

    throw new NotFoundError("Clinique");
  }

  async getClinicStaff(userId: string, role: string) {
    let clinicId: string | null = null;

    if (role === "VETERINARIAN") {
      const vc = await prisma.veterinarianClinic.findFirst({
        where: { veterinarianId: userId },
      });
      clinicId = vc?.clinicId ?? null;
    } else if (role === "SECRETARY") {
      const sp = await prisma.secretaryProfile.findUnique({
        where: { id: userId },
      });
      clinicId = sp?.clinicId ?? null;
    } else if (role === "DIRECTOR") {
      const dp = await prisma.directorClinicProfile.findUnique({
        where: { id: userId },
      });
      clinicId = dp?.clinicId ?? null;
    } else if (role === "REFERANT") {
      const rp = await prisma.referentClinicProfile.findUnique({
        where: { id: userId },
      });
      clinicId = rp?.clinicId ?? null;
    }

    if (!clinicId) throw new NotFoundError("Clinique");

    const [directorProfile, referents, vets, secretaries] = await Promise.all([
      prisma.directorClinicProfile.findFirst({
        where: { clinicId },
        include: {
          user: {
            select: { id: true, firstname: true, lastname: true, email: true },
          },
        },
      }),
      prisma.referentClinicProfile.findMany({
        where: { clinicId },
        include: {
          user: {
            select: { id: true, firstname: true, lastname: true, email: true },
          },
        },
      }),
      prisma.veterinarianClinic.findMany({
        where: { clinicId },
        include: {
          veterinarian: {
            include: {
              user: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.secretaryProfile.findMany({
        where: { clinicId },
        include: {
          user: {
            select: { id: true, firstname: true, lastname: true, email: true },
          },
        },
      }),
    ]);

    return {
      director: directorProfile
        ? { ...directorProfile.user, role: "DIRECTOR" as const }
        : null,
      referents: referents.map((r) => ({
        ...r.user,
        role: "REFERANT" as const,
      })),
      veterinarians: vets.map((v) => ({
        ...v.veterinarian.user,
        role: "VETERINARIAN" as const,
        licenseNumber: v.veterinarian.licenseNumber,
      })),
      secretaries: secretaries.map((s) => ({
        ...s.user,
        role: "SECRETARY" as const,
      })),
    };
  }

  async updateClinic(userId: string, data: UpdateClinic) {
    const profile = await prisma.directorClinicProfile.findUnique({
      where: { id: userId },
    });
    if (!profile)
      throw new BadRequestError(
        "Aucune clinique associée à ce compte directeur",
      );

    const clinic = await prisma.clinic.update({
      where: { id: profile.clinicId },
      data,
    });

    return clinic;
  }
}
