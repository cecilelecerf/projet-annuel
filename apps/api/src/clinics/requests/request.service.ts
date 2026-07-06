import { BadRequestError, ConflictError } from "@api/errors";
import type { CreateClinicRequest } from "@armali/schemas";
import { RequestRepository } from "./request.repository";

export class RequestService {
  constructor(
    private readonly repository: RequestRepository = new RequestRepository(),
  ) {}

  async getClinicStatus(directorUserId: string) {
    const profile = await this.repository.findProfileWithClinic(directorUserId);

    // Le profil existe désormais dès l'inscription du directeur (avant même
    // toute approbation) : sa seule présence ne prouve plus rien. Seule la
    // présence de `clinic` (donc de clinicId) atteste d'une clinique approuvée.
    if (profile?.clinic)
      return { status: "APPROVED" as const, clinic: profile.clinic };

    const latestRequest =
      await this.repository.findLatestRequest(directorUserId);

    if (!latestRequest) return { status: "NONE" as const };
    if (latestRequest.status === "PENDING")
      return { status: "PENDING" as const, request: latestRequest };
    if (latestRequest.status === "REJECTED")
      return { status: "REJECTED" as const, request: latestRequest };

    return { status: "NONE" as const };
  }

  async requestClinic(directorUserId: string, data: CreateClinicRequest) {
    const profile = await this.repository.findProfile(directorUserId);
    // Même correction ici : vérifier clinicId, pas juste l'existence du profil.
    if (profile?.clinic)
      throw new BadRequestError("Vous avez déjà une clinique approuvée");

    const pendingRequest =
      await this.repository.findPendingRequestByRequest(directorUserId);
    if (pendingRequest)
      throw new ConflictError(
        "Vous avez déjà une demande en attente de validation",
      );

    const existingClinic = await this.repository.findClinicBySiret(data.siret);
    if (existingClinic)
      throw new ConflictError("Une clinique avec ce numéro SIRET existe déjà");

    const siretPending = await this.repository.findPendingRequestBySiret(
      data.siret,
    );
    if (siretPending)
      throw new ConflictError(
        "Une demande avec ce numéro SIRET est déjà en attente",
      );

    return this.repository.createRequest(directorUserId, data);
  }

  async getMyRequests(directorUserId: string) {
    return this.repository.findRequestsByRequest(directorUserId);
  }
}
