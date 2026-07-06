import { BadRequestError, ConflictError, NotFoundError } from "@api/errors";
import type { CreateClinicRequest } from "@armali/schemas";
import { ClinicRequestRepository } from "./request.repository";

export class ClinicRequestService {
  constructor(private readonly repository: ClinicRequestRepository) {}

  private async geocodeAddress(address: string) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { "User-Agent": "Armali/1.0" } },
    );
    const results = await res.json();
    const [result] = results;

    if (!result) {
      console.warn(`⚠️ Geocoding failed for: "${address}"`);
      return { lat: 0, lng: 0 };
    }

    console.log(`✅ ${address} → ${result.lat}, ${result.lon}`);
    return { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
  }

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

  async createRequestClinic(directorUserId: string, data: CreateClinicRequest) {
    const profile = await this.repository.findProfileWithClinic(directorUserId);
    if (profile?.clinic)
      throw new BadRequestError("Vous avez déjà une clinique approuvée");

    const pendingRequest =
      await this.repository.findPendingRequestByDirector(directorUserId);
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

    const request = await this.repository.createRequest(directorUserId, data);
    return { status: request.status, request };
  }

  async getMyRequests(directorUserId: string) {
    return this.repository.findRequestsByDirector(directorUserId);
  }

  async getClinicRequests() {
    return this.repository.findAllRequests();
  }

  async approveClinicRequest(requestId: string) {
    const request = await this.repository.findRequestById(requestId);
    if (!request) throw new NotFoundError("Demande");
    if (request.status !== "PENDING") {
      throw new BadRequestError("Cette demande a déjà été traitée");
    }

    const existingClinic = await this.repository.findClinicBySiret(
      request.siret,
    );
    if (existingClinic) {
      throw new ConflictError(
        "Une clinique avec ce numéro SIRET existe déjà. Veuillez rejeter cette demande.",
      );
    }

    const geo = await this.geocodeAddress(request.address);

    await this.repository.approveRequest(request, geo);

    return { message: "Demande approuvée, clinique créée" };
  }

  async rejectClinicRequest(requestId: string) {
    const request = await this.repository.findRequestById(requestId);
    if (!request) throw new NotFoundError("Demande");

    return this.repository.rejectRequest(requestId);
  }
}
