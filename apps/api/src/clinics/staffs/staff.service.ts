import { hash } from "bcryptjs";
import { ClinicId, UserId } from "@armali/schemas";
import type {
  CreateVeterinarianStaff,
  CreateSecretaryStaff,
  CreateReferentStaff,
  UserRole,
} from "@armali/schemas";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/errors";
import { StaffRepository } from "./staff.repository";
import { CLINIC_STAFF_ROLES, STAFF_ROLES } from "@api/utils";
import { ClinicService } from "@api/clinics/clinic.service";
import { VeterinarianClinicService } from "@api/clinics/veterinarian-clinics/veterinarian-clinic.service";
import { EmailService } from "@api/emails/email.service";
import { withAvatarUrl } from "@api/users/user.utils";

const DELETABLE_ROLES: UserRole[] = ["VETERINARIAN", "REFERENT", "SECRETARY"];

export class StaffService {
  constructor(
    private repository: StaffRepository,
    private clinicService: ClinicService,
    private veterinarianClinicService: VeterinarianClinicService,
    private emailService: EmailService,
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

  // ── Recherche + rattachement d'un vétérinaire existant ────────────────────
  async searchVeterinarian({
    authorId,
    query,
  }: {
    authorId: UserId;
    query: string;
  }) {
    const clinics = await this.clinicService.getClinicsByUser(authorId);
    if (!clinics) throw new NotFoundError("clinic");
    if (clinics.length !== 1)
      throw new ConflictError("Multiple clinics associated with the user");

    const q = query.trim();
    if (!q)
      throw new BadRequestError(
        "Veuillez indiquer un email ou un numéro de licence",
      );

    return this.repository.searchVeterinarian(q, clinics[0].id);
  }

  async linkVeterinarian({
    authorId,
    authorRole,
    veterinarianId,
  }: {
    authorId: UserId;
    authorRole: UserRole;
    veterinarianId: string;
  }) {
    const clinics = await this.clinicService.getClinicsByUser(authorId);
    if (!clinics) throw new NotFoundError("clinic");
    if (clinics.length !== 1)
      throw new ConflictError("Multiple clinics associated with the user");
    const clinic = clinics[0];

    const vetProfile =
      await this.repository.findVeterinarianProfile(veterinarianId);
    if (!vetProfile) throw new NotFoundError("Vétérinaire");

    const linked = await this.veterinarianClinicService.create({
      veterinarianId,
      clinicId: clinic.id,
      role: authorRole,
    });

    this.emailService
      .sendClinicLinked(vetProfile.user.email, vetProfile.user.firstname, clinic.name)
      .catch(() => {});

    return linked;
  }

  // ── Suppression / retrait d'un membre du staff ────────────────────────────
  async deleteStaffMember({
    authorId,
    authorRole,
    memberId,
  }: {
    authorId: UserId;
    authorRole: UserRole;
    memberId: UserId;
  }) {
    const clinics = await this.clinicService.getClinicsByUser(authorId);
    if (!clinics) throw new NotFoundError("clinic");
    if (clinics.length !== 1)
      throw new ConflictError("Multiple clinics associated with the user");
    const clinicId = clinics[0].id;

    const target = await this.repository.findMemberDetailById(memberId);
    if (!target) throw new NotFoundError("Utilisateur");
    if (!DELETABLE_ROLES.includes(target.role)) throw new ForbiddenError();
    // Un référent ne peut pas retirer un autre référent, seul un directeur le peut.
    if (target.role === "REFERENT" && authorRole !== "DIRECTOR")
      throw new ForbiddenError();

    // Un vétérinaire peut travailler dans plusieurs cliniques : on ne
    // supprime que son rattachement à celle-ci, jamais son compte ni son
    // historique de rendez-vous/dossiers médicaux.
    if (target.role === "VETERINARIAN") {
      const link = await this.repository.findVeterinarianClinicLink(
        memberId,
        clinicId,
      );
      if (!link) throw new NotFoundError("Utilisateur");
      await this.repository.unlinkVeterinarian(link.id);
      return { message: "Vétérinaire retiré de la clinique" };
    }

    let targetClinicId: string | undefined;
    if (target.role === "REFERENT") {
      targetClinicId = (
        await this.repository.findReferentClinicId(memberId)
      )?.clinicId;
    } else if (target.role === "SECRETARY") {
      targetClinicId = (
        await this.repository.findSecretaryClinicId(memberId)
      )?.clinicId;
    }
    if (targetClinicId !== clinicId) throw new NotFoundError("Utilisateur");

    await this.repository.deleteMember(memberId);
    return { message: "Compte supprimé" };
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
