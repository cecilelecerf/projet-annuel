import { hash } from "bcryptjs";
import { prisma } from "@api/lib/prisma";
import { BadRequestError, NotFoundError, ForbiddenError } from "@api/errors";
import type {
  CreateVeterinarianStaff,
  CreateSecretaryStaff,
  UpdateClinicReferent,
  UpdateClinicSpecialities,
} from "@armali/schemas";

// Statuts de commande considérés comme des ventes effectives (exclut PENDING et CANCELLED)
const REVENUE_STATUSES = ["CONFIRMED", "READY", "PICKED_UP"] as const;

export class ReferentService {
  private async getClinicId(referentUserId: string): Promise<string> {
    const profile = await prisma.referentClinicProfile.findUnique({
      where: { id: referentUserId },
    });
    if (!profile)
      throw new BadRequestError(
        "Aucune clinique associée à ce compte référent"
      );
    return profile.clinicId;
  }

  async getClinicStaff(referentUserId: string) {
    const clinicId = await this.getClinicId(referentUserId);

    const [directorProfile, referents, vets, secretaries] = await Promise.all([
      prisma.directorClinicProfile.findFirst({
        where: { clinicId },
        include: { user: { select: { id: true, firstname: true, lastname: true, email: true } } },
      }),
      prisma.referentClinicProfile.findMany({
        where: { clinicId },
        include: { user: { select: { id: true, firstname: true, lastname: true, email: true } } },
      }),
      prisma.veterinarianClinic.findMany({
        where: { clinicId },
        include: {
          veterinarian: {
            include: { user: { select: { id: true, firstname: true, lastname: true, email: true } } },
          },
        },
      }),
      prisma.secretaryProfile.findMany({
        where: { clinicId },
        include: { user: { select: { id: true, firstname: true, lastname: true, email: true } } },
      }),
    ]);

    return {
      director: directorProfile ? { ...directorProfile.user, role: "DIRECTOR" as const } : null,
      referents: referents.map((r) => ({ ...r.user, role: "REFERENT" as const })),
      veterinarians: vets.map((v) => ({ ...v.veterinarian.user, role: "VETERINARIAN" as const, licenseNumber: v.veterinarian.licenseNumber })),
      secretaries: secretaries.map((s) => ({ ...s.user, role: "SECRETARY" as const })),
    };
  }

  async getStaffMemberDetail(referentUserId: string, memberId: string) {
    const clinicId = await this.getClinicId(referentUserId);

    const user = await prisma.user.findUnique({
      where: { id: memberId },
      include: {
        veterinarianProfile: {
          include: {
            veterinarianIdentity: true,
            bankingInfo: true,
            speciality: true,
            veterinarianClinic: true,
          },
        },
        secretaryProfile: {
          include: { bankingInfo: true },
        },
        directorClinicProfile: true,
        referentClinicProfile: true,
      },
    });

    if (!user) throw new NotFoundError("Membre du personnel");

    const belongsToClinic =
      (user.veterinarianProfile?.veterinarianClinic ?? []).some(
        (vc) => vc.clinicId === clinicId,
      ) ||
      user.secretaryProfile?.clinicId === clinicId ||
      user.directorClinicProfile?.clinicId === clinicId ||
      user.referentClinicProfile?.clinicId === clinicId;

    if (!belongsToClinic) throw new ForbiddenError();

    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  async createVeterinarian(referentUserId: string, data: CreateVeterinarianStaff) {
    const clinicId = await this.getClinicId(referentUserId);
    const hashedPassword = await hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname,
        password: hashedPassword,
        role: "VETERINARIAN",
        veterinarianProfile: {
          create: {
            licenseNumber: data.licenseNumber,
            bio: data.bio,
            veterinarianClinic: {
              create: { clinicId },
            },
            ...(data.identity && {
              veterinarianIdentity: { create: data.identity },
            }),
            ...(data.bankingInfo && {
              bankingInfo: { create: data.bankingInfo },
            }),
            ...(data.specialityIds &&
              data.specialityIds.length > 0 && {
                speciality: {
                  connect: data.specialityIds.map((id) => ({ id })),
                },
              }),
          },
        },
      },
      include: {
        veterinarianProfile: {
          include: {
            veterinarianIdentity: true,
            bankingInfo: true,
            speciality: true,
          },
        },
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createSecretary(referentUserId: string, data: CreateSecretaryStaff) {
    const clinicId = await this.getClinicId(referentUserId);
    const hashedPassword = await hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname,
        password: hashedPassword,
        role: "SECRETARY",
        secretaryProfile: {
          create: {
            clinicId,
            ...(data.bankingInfo && {
              bankingInfo: { create: data.bankingInfo },
            }),
          },
        },
      },
      include: { secretaryProfile: { include: { bankingInfo: true } } },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateClinic(referentUserId: string, data: UpdateClinicReferent) {
    const clinicId = await this.getClinicId(referentUserId);

    return prisma.clinic.update({
      where: { id: clinicId },
      data,
    });
  }

  async getClinicSpecialities(referentUserId: string) {
    const clinicId = await this.getClinicId(referentUserId);
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { speciality: true },
    });
    return clinic?.speciality ?? [];
  }

  async updateClinicSpecialities(
    referentUserId: string,
    data: UpdateClinicSpecialities,
  ) {
    const clinicId = await this.getClinicId(referentUserId);
    const clinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        speciality: {
          set: data.specialityIds.map((id) => ({ id })),
        },
      },
      include: { speciality: true },
    });
    return clinic.speciality;
  }

  // ── Dashboard (page d'accueil référent) ───────────────────────────────────

  async getDashboard(referentUserId: string) {
    const clinicId = await this.getClinicId(referentUserId);

    const [clinic, vetClinics, staffCounts, clinicProducts, orders] =
      await Promise.all([
        prisma.clinic.findUnique({
          where: { id: clinicId },
          select: { name: true },
        }),
        // Vétérinaires de la clinique + leurs avis
        prisma.veterinarianClinic.findMany({
          where: { clinicId },
          include: {
            veterinarian: {
              include: {
                user: { select: { firstname: true, lastname: true } },
                reviews: { select: { rating: true } },
              },
            },
          },
        }),
        Promise.all([
          prisma.veterinarianClinic.count({ where: { clinicId } }),
          prisma.secretaryProfile.count({ where: { clinicId } }),
        ]),
        
        prisma.clinicProduct.findMany({
          where: { clinicId },
          select: { stock: true, minimumRequired: true },
        }),
        
        prisma.order.findMany({
          where: { clinicId },
          select: {
            status: true,
            createdAt: true,
            orderItems: { select: { quantity: true, unitPrice: true } },
          },
        }),
      ]);

    if (!clinic) throw new NotFoundError("Clinique");

    // ── Stats vétérinaires ──────────────────────────────────────────────
    const veterinarianStats = vetClinics.map((vc) => {
      const reviews = vc.veterinarian.reviews;
      const avg =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : null;
      return {
        id: vc.veterinarianId,
        firstname: vc.veterinarian.user.firstname,
        lastname: vc.veterinarian.user.lastname,
        averageRating: avg ? Math.round(avg * 10) / 10 : null,
        reviewCount: reviews.length,
      };
    });

    const allRatings = vetClinics.flatMap((vc) =>
      vc.veterinarian.reviews.map((r) => r.rating),
    );
    const clinicAverageRating =
      allRatings.length > 0
        ? Math.round((allRatings.reduce((s, r) => s + r, 0) / allRatings.length) * 10) / 10
        : null;

    // ── Stats stock ─────────────────────────────────────────────────────
    const lowStockCount = clinicProducts.filter(
      (p) => p.stock <= p.minimumRequired,
    ).length;

    // ── Stats ventes ────────────────────────────────────────────────────
    const revenueOrders = orders.filter((o) =>
      (REVENUE_STATUSES as readonly string[]).includes(o.status),
    );
    const totalRevenue = revenueOrders.reduce(
      (sum, order) =>
        sum +
        order.orderItems.reduce(
          (itemSum, item) => itemSum + item.quantity * Number(item.unitPrice),
          0,
        ),
      0,
    );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrdersCount = orders.filter(
      (o) => o.createdAt >= thirtyDaysAgo,
    ).length;

    return {
      clinic: {
        name: clinic.name,
        veterinarianCount: staffCounts[0],
        secretaryCount: staffCounts[1],
      },
      reviews: {
        clinicAverageRating,
        totalReviews: allRatings.length,
        veterinarianStats,
      },
      sales: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrdersCount: orders.length,
        recentOrdersCount,
        lowStockCount,
      },
    };
  }
}