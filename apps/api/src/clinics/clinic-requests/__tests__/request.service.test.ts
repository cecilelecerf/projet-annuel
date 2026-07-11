import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestError, ConflictError, NotFoundError } from "@api/errors";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRepository = vi.hoisted(() => ({
  findProfileWithClinic: vi.fn(),
  findLatestRequest: vi.fn(),
  findPendingRequestByDirector: vi.fn(),
  findClinicBySiret: vi.fn(),
  findPendingRequestBySiret: vi.fn(),
  createRequest: vi.fn(),
  findRequestsByDirector: vi.fn(),
  findAllRequests: vi.fn(),
  findRequestById: vi.fn(),
  rejectRequest: vi.fn(),
  approveRequest: vi.fn(),
}));

vi.mock("../request.repository", () => ({
  ClinicRequestRepository: vi.fn(function () {
    return mockRepository;
  }),
}));

const { ClinicRequestRepository } = await import("../request.repository");
const { ClinicRequestService } = await import("../request.service");

const service = new ClinicRequestService(
  new ClinicRequestRepository({} as any),
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const DIRECTOR_ID = "11111111-1111-4111-8111-111111111111";
const REQUEST_ID = "22222222-2222-4222-8222-222222222222";

const makeRequest = (overrides = {}) => ({
  id: REQUEST_ID,
  name: "Clinique Test",
  address: "1 rue de Paris",
  siret: "12345678901234",
  phone: "0123456789",
  website: "https://clinique.fr",
  description: null,
  status: "PENDING" as const,
  directorId: DIRECTOR_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  director: {
    id: DIRECTOR_ID,
    user: {
      firstname: "Paul",
      lastname: "Martin",
      email: "directeur@gmail.com",
      avatarUrl: null,
    },
  },
  ...overrides,
});

// Mock du fetch global utilisé par geocodeAddress (appel externe Nominatim)
function mockGeocodingSuccess() {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    json: async () => [{ lat: "48.8566", lon: "2.3522" }],
  } as Response);
}

function mockGeocodingFailure() {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    json: async () => [],
  } as Response);
}

beforeEach(() => vi.clearAllMocks());

// ── getClinicStatus ────────────────────────────────────────────────────────────

describe("ClinicRequestService.getClinicStatus", () => {
  it("APPROVED — profil avec clinique", async () => {
    const clinic = { id: "clinic-1", name: "Clinique Test" };
    mockRepository.findProfileWithClinic.mockResolvedValue({
      id: DIRECTOR_ID,
      clinic,
    });

    const result = await service.getClinicStatus(DIRECTOR_ID);

    expect(result).toEqual({ status: "APPROVED", clinic });
    // Aucune demande ne devrait être recherchée si déjà approuvé
    expect(mockRepository.findLatestRequest).not.toHaveBeenCalled();
  });

  it("NONE — profil sans clinique et aucune demande", async () => {
    mockRepository.findProfileWithClinic.mockResolvedValue({
      id: DIRECTOR_ID,
      clinic: null,
    });
    mockRepository.findLatestRequest.mockResolvedValue(null);

    const result = await service.getClinicStatus(DIRECTOR_ID);

    expect(result).toEqual({ status: "NONE" });
  });

  it("NONE — aucun profil du tout", async () => {
    mockRepository.findProfileWithClinic.mockResolvedValue(null);
    mockRepository.findLatestRequest.mockResolvedValue(null);

    const result = await service.getClinicStatus(DIRECTOR_ID);

    expect(result).toEqual({ status: "NONE" });
  });

  it("PENDING — demande la plus récente en attente", async () => {
    mockRepository.findProfileWithClinic.mockResolvedValue({
      id: DIRECTOR_ID,
      clinic: null,
    });
    const pending = makeRequest({ status: "PENDING" });
    mockRepository.findLatestRequest.mockResolvedValue(pending);

    const result = await service.getClinicStatus(DIRECTOR_ID);

    expect(result).toEqual({ status: "PENDING", request: pending });
  });

  it("REJECTED — demande la plus récente refusée", async () => {
    mockRepository.findProfileWithClinic.mockResolvedValue({
      id: DIRECTOR_ID,
      clinic: null,
    });
    const rejected = makeRequest({ status: "REJECTED" });
    mockRepository.findLatestRequest.mockResolvedValue(rejected);

    const result = await service.getClinicStatus(DIRECTOR_ID);

    expect(result).toEqual({ status: "REJECTED", request: rejected });
  });

  it("NONE — demande la plus récente déjà APPROVED mais profil sans clinique (incohérence)", async () => {
    // Cas limite : données incohérentes (ne devrait normalement pas arriver),
    // documente le comportement actuel plutôt que de le supposer.
    mockRepository.findProfileWithClinic.mockResolvedValue({
      id: DIRECTOR_ID,
      clinic: null,
    });
    mockRepository.findLatestRequest.mockResolvedValue(
      makeRequest({ status: "APPROVED" }),
    );

    const result = await service.getClinicStatus(DIRECTOR_ID);

    expect(result).toEqual({ status: "NONE" });
  });
});

// ── createRequestClinic ────────────────────────────────────────────────────────

describe("ClinicRequestService.createRequestClinic", () => {
  const payload = {
    name: "Nouvelle clinique",
    address: "5 rue du Test",
    siret: "98765432109876",
    phone: "0102030405",
    website: "https://nouvelle-clinique.fr",
  };

  it("clinique déjà approuvée — BadRequestError", async () => {
    mockRepository.findProfileWithClinic.mockResolvedValue({
      id: DIRECTOR_ID,
      clinic: { id: "clinic-1" },
    });

    await expect(
      service.createRequestClinic(DIRECTOR_ID, payload),
    ).rejects.toThrow(BadRequestError);

    expect(mockRepository.createRequest).not.toHaveBeenCalled();
  });

  it("demande déjà en attente — ConflictError", async () => {
    mockRepository.findProfileWithClinic.mockResolvedValue({
      id: DIRECTOR_ID,
      clinic: null,
    });
    mockRepository.findPendingRequestByDirector.mockResolvedValue(
      makeRequest(),
    );

    await expect(
      service.createRequestClinic(DIRECTOR_ID, payload),
    ).rejects.toThrow(ConflictError);

    expect(mockRepository.createRequest).not.toHaveBeenCalled();
  });

  it("siret déjà utilisé par une clinique existante — ConflictError", async () => {
    mockRepository.findProfileWithClinic.mockResolvedValue({
      id: DIRECTOR_ID,
      clinic: null,
    });
    mockRepository.findPendingRequestByDirector.mockResolvedValue(null);
    mockRepository.findClinicBySiret.mockResolvedValue({ id: "clinic-1" });

    await expect(
      service.createRequestClinic(DIRECTOR_ID, payload),
    ).rejects.toThrow(ConflictError);

    expect(mockRepository.createRequest).not.toHaveBeenCalled();
  });

  it("siret déjà utilisé par une autre demande en attente — ConflictError", async () => {
    mockRepository.findProfileWithClinic.mockResolvedValue({
      id: DIRECTOR_ID,
      clinic: null,
    });
    mockRepository.findPendingRequestByDirector.mockResolvedValue(null);
    mockRepository.findClinicBySiret.mockResolvedValue(null);
    mockRepository.findPendingRequestBySiret.mockResolvedValue(
      makeRequest({ directorId: "someone-else" }),
    );

    await expect(
      service.createRequestClinic(DIRECTOR_ID, payload),
    ).rejects.toThrow(ConflictError);

    expect(mockRepository.createRequest).not.toHaveBeenCalled();
  });

  it("crée la demande quand tout est valide", async () => {
    mockRepository.findProfileWithClinic.mockResolvedValue({
      id: DIRECTOR_ID,
      clinic: null,
    });
    mockRepository.findPendingRequestByDirector.mockResolvedValue(null);
    mockRepository.findClinicBySiret.mockResolvedValue(null);
    mockRepository.findPendingRequestBySiret.mockResolvedValue(null);
    mockRepository.createRequest.mockResolvedValue(makeRequest(payload));

    const result = await service.createRequestClinic(DIRECTOR_ID, payload);

    expect(mockRepository.createRequest).toHaveBeenCalledWith(
      DIRECTOR_ID,
      payload,
    );
    expect(result.status).toBe("PENDING");
    expect(result.request.siret).toBe(payload.siret);
  });
});

// ── getMyRequests / getClinicRequests ───────────────────────────────────────────

describe("ClinicRequestService.getMyRequests", () => {
  it("délègue au repository avec le bon directorId", async () => {
    const requests = [makeRequest()];
    mockRepository.findRequestsByDirector.mockResolvedValue(requests);

    const result = await service.getMyRequests(DIRECTOR_ID);

    expect(mockRepository.findRequestsByDirector).toHaveBeenCalledWith(
      DIRECTOR_ID,
    );
    expect(result).toEqual(requests);
  });
});

describe("ClinicRequestService.getClinicRequests", () => {
  it("délègue au repository", async () => {
    const requests = [makeRequest()];
    mockRepository.findAllRequests.mockResolvedValue(requests);

    const result = await service.getClinicRequests();

    expect(mockRepository.findAllRequests).toHaveBeenCalled();
    expect(result).toEqual(requests);
  });
});

// ── approveClinicRequest ─────────────────────────────────────────────────────

describe("ClinicRequestService.approveClinicRequest", () => {
  it("demande introuvable — NotFoundError", async () => {
    mockRepository.findRequestById.mockResolvedValue(null);

    await expect(service.approveClinicRequest(REQUEST_ID)).rejects.toThrow(
      NotFoundError,
    );

    expect(mockRepository.approveRequest).not.toHaveBeenCalled();
  });

  it("demande déjà traitée — BadRequestError", async () => {
    mockRepository.findRequestById.mockResolvedValue(
      makeRequest({ status: "REJECTED" }),
    );

    await expect(service.approveClinicRequest(REQUEST_ID)).rejects.toThrow(
      BadRequestError,
    );

    expect(mockRepository.approveRequest).not.toHaveBeenCalled();
  });

  it("siret déjà utilisé par une clinique existante — ConflictError", async () => {
    mockRepository.findRequestById.mockResolvedValue(
      makeRequest({ status: "PENDING" }),
    );
    mockRepository.findClinicBySiret.mockResolvedValue({ id: "clinic-1" });

    await expect(service.approveClinicRequest(REQUEST_ID)).rejects.toThrow(
      ConflictError,
    );

    expect(mockRepository.approveRequest).not.toHaveBeenCalled();
  });

  it("géocodage réussi — approuve avec les coordonnées trouvées", async () => {
    const pendingRequest = makeRequest({ status: "PENDING" });
    mockRepository.findRequestById.mockResolvedValue(pendingRequest);
    mockRepository.findClinicBySiret.mockResolvedValue(null);
    mockRepository.approveRequest.mockResolvedValue(
      makeRequest({ status: "APPROVED" }),
    );
    const fetchSpy = mockGeocodingSuccess();

    try {
      const result = await service.approveClinicRequest(REQUEST_ID);

      expect(mockRepository.approveRequest).toHaveBeenCalledWith(
        pendingRequest,
        { lat: 48.8566, lng: 2.3522 },
      );
      expect(result).toEqual({ message: "Demande approuvée, clinique créée" });
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("géocodage en échec — approuve quand même avec lat/lng à 0", async () => {
    const pendingRequest = makeRequest({ status: "PENDING" });
    mockRepository.findRequestById.mockResolvedValue(pendingRequest);
    mockRepository.findClinicBySiret.mockResolvedValue(null);
    mockRepository.approveRequest.mockResolvedValue(
      makeRequest({ status: "APPROVED" }),
    );
    const fetchSpy = mockGeocodingFailure();

    try {
      await service.approveClinicRequest(REQUEST_ID);

      expect(mockRepository.approveRequest).toHaveBeenCalledWith(
        pendingRequest,
        { lat: 0, lng: 0 },
      );
    } finally {
      fetchSpy.mockRestore();
    }
  });
});

// ── rejectClinicRequest ──────────────────────────────────────────────────────

describe("ClinicRequestService.rejectClinicRequest", () => {
  it("demande introuvable — NotFoundError", async () => {
    mockRepository.findRequestById.mockResolvedValue(null);

    await expect(service.rejectClinicRequest(REQUEST_ID)).rejects.toThrow(
      NotFoundError,
    );

    expect(mockRepository.rejectRequest).not.toHaveBeenCalled();
  });

  it("rejette la demande existante", async () => {
    mockRepository.findRequestById.mockResolvedValue(makeRequest());
    mockRepository.rejectRequest.mockResolvedValue(
      makeRequest({ status: "REJECTED" }),
    );

    const result = await service.rejectClinicRequest(REQUEST_ID);

    expect(mockRepository.rejectRequest).toHaveBeenCalledWith(REQUEST_ID);
    expect(result.status).toBe("REJECTED");
  });
});
