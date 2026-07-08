import { hash } from "bcryptjs";
import { ClinicId, UserId } from "@armali/schemas";
import type {
  CreateVeterinarianStaff,
  CreateSecretaryStaff,
  CreateReferentStaff,
} from "@armali/schemas";
import { ConflictError, ForbiddenError, NotFoundError } from "@api/errors";
import { StaffRepository } from "./staff.repository";
import { CLINIC_STAFF_ROLES, STAFF_ROLES } from "@api/utils";
import { ClinicService } from "@api/clinics/clinic.service";
import { UserRole } from "../../prisma/generated/prisma/enums";
import { withAvatarUrl } from "@api/users/user.utils";

export class StaffService {
  constructor(
    private repository: StaffRepository,
    private clinicService: ClinicService,
  ) {}

  // Vérifie que l'acteur a bien accès à cette clinique, sinon ForbiddenError
  private async assertClinicAccess(authorId: UserId, clinicId: ClinicId) {
    const clinics = await this.clinicService.getClinicsByUser(authorId);
    if (!clinics.some(({ id }) => id === clinicId)) {
      throw new ForbiddenError();
    }
  }

  // ── Staff d'une clinique, filtré par rôle cible ─────────────────────────────
  async getStaffByClinicRole({
    role,
    clinicId,
    targetRoles,
    authorId,
  }: {
    clinicId: ClinicId;
    authorId: UserId;
    role: UserRole;
    targetRoles?: UserRole[];
  }) {
    if (!STAFF_ROLES.includes(role)) throw new ForbiddenError();

    await this.assertClinicAccess(authorId, clinicId);

    const clinicStaff = await this.repository.findStaff(clinicId);
    if (!clinicStaff) throw new NotFoundError("Clinique");
    if (!clinicStaff.director) throw new NotFoundError("Director clinique");

    const wantsRole = (r: UserRole) => !targetRoles || targetRoles.includes(r);

    const staffs = [
      ...(wantsRole("DIRECTOR") ? [clinicStaff.director] : []),
      ...(wantsRole("REFERENT") ? clinicStaff.referents : []),
      ...(wantsRole("SECRETARY") ? clinicStaff.secretaries : []),
      ...(wantsRole("VETERINARIAN") ? clinicStaff.veterinarians : []),
    ];

    return staffs.map(withAvatarUrl);
  }

  // ── Détail d'un membre du staff ──────────────────────────────────────────
  async getStaffMemberDetail({
    authorId,
    memberId,
  }: {
    authorId: UserId;
    memberId: UserId;
  }) {
    const clinics = await this.clinicService.getClinicsByUser(authorId);
    if (!clinics) throw new NotFoundError("clinic");
    if (clinics.length !== 1)
      throw new ConflictError("Multiple clinics associated with the user");
    const clinicId = clinics[0].id;
    const user = await this.repository.findMemberDetailById(memberId);
    if (!user) throw new NotFoundError("Membre du personnel");

    const belongsToClinic =
      (user.veterinarianProfile?.veterinarianClinics ?? []).some(
        (vc) => vc.clinicId === clinicId,
      ) ||
      user.secretaryProfile?.clinicId === clinicId ||
      user.directorClinicProfile?.clinic?.id === clinicId ||
      user.referentClinicProfile?.clinicId === clinicId;
    if (!belongsToClinic) throw new ForbiddenError();
    const { password: _password, ...safeUser } = user;
    return withAvatarUrl(safeUser);
  }

  // ── Création d'un vétérinaire ─────────────────────────────────────────────
  async createVeterinarian({
    authorId,
    data,
  }: {
    authorId: UserId;
    data: CreateVeterinarianStaff;
  }) {
    const clinics = await this.clinicService.getClinicsByUser(authorId);
    if (!clinics) throw new NotFoundError("clinic");
    if (clinics.length !== 1)
      throw new ConflictError("Multiple clinics associated with the user");

    const hashedPassword = await hash(data.password, 10);
    const veterinarian = await this.repository.createVeterinarian({
      clinicId: clinics[0].id,
      data,
      hashedPassword,
    });
    return withAvatarUrl(veterinarian);
  }

  // ── Création d'une secrétaire ─────────────────────────────────────────────
  async createSecretary({
    authorId,
    data,
  }: {
    authorId: UserId;
    data: CreateSecretaryStaff;
  }) {
    const clinics = await this.clinicService.getClinicsByUser(authorId);
    if (!clinics) throw new NotFoundError("clinic");
    if (clinics.length !== 1)
      throw new ConflictError("Multiple clinics associated with the user");

    const hashedPassword = await hash(data.password, 10);
    return withAvatarUrl(
      await this.repository.createSecretary({
        clinicId: clinics[0].id,
        data,
        hashedPassword,
      }),
    );
  }

  async createReferent({
    authorId,
    data,
  }: {
    authorId: UserId;
    data: CreateReferentStaff;
  }) {
    const clinics = await this.clinicService.getClinicsByUser(authorId);
    if (!clinics) throw new NotFoundError("clinic");
    if (clinics.length !== 1)
      throw new ConflictError("Multiple clinics associated with the user");

    const hashedPassword = await hash(data.password, 10);
    return withAvatarUrl(
      await this.repository.createReferent({
        clinicId: clinics[0].id as ClinicId,
        data,
        hashedPassword,
      }),
    );
  }

  async getStaffIdsByUser({
    authorId,
    authorRole,
    targetRole,
  }: {
    authorId: UserId;
    authorRole: UserRole;
    targetRole?: UserRole[];
  }) {
    if (!CLINIC_STAFF_ROLES.includes(authorRole)) throw new ForbiddenError();
    const clinicId = await this.clinicService.getClinicIdByUserId({
      userId: authorId,
      role: authorRole,
    });
    return await this.repository.findStaffIds(clinicId, targetRole);
  }

  async getStaffCountByUser({
    authorId,
    authorRole,
    targetRole,
  }: {
    authorId: UserId;
    authorRole: UserRole;
    targetRole?: UserRole[];
  }) {
    if (!CLINIC_STAFF_ROLES.includes(authorRole)) throw new ForbiddenError();
    const clinicId = await this.clinicService.getClinicIdByUserId({
      userId: authorId,
      role: authorRole,
    });
    return await this.repository.countStaff(clinicId, targetRole);
  }
}
