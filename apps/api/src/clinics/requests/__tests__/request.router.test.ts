import { describe, it, expect, vi } from "vitest";
import { randomUUID } from "crypto";
import { hash } from "bcryptjs";
import request from "supertest";
import { app } from "@api/app";
import { loginAs } from "@api/meetings/__tests__/meeting.route.test";
import { getPrisma } from "../../../../__tests__/setup";

// ── Helpers ──────────────────────────────────────────────────────────────────

const DISPOSABLE_PASSWORD = "Password123!";

async function createDisposableDirector() {
  const prisma = getPrisma();
  const email = `disposable-director-${randomUUID()}@test.com`;
  const password = await hash(DISPOSABLE_PASSWORD, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password,
      firstname: "Test",
      lastname: "Jetable",
      role: "DIRECTOR",
    },
  });
  await prisma.directorClinicProfile.create({ data: { id: user.id } });

  return { userId: user.id, email };
}

function makeSiret() {
  // 14 chiffres, unique à chaque appel
  return `9${Date.now()}${Math.floor(Math.random() * 100)}`.slice(0, 14);
}

async function createDisposableRequest(
  directorUserId: string,
  overrides: Partial<{
    status: "PENDING" | "APPROVED" | "REJECTED";
    siret: string;
  }> = {},
) {
  const prisma = getPrisma();
  return prisma.clinicRequest.create({
    data: {
      name: "Clinique jetable",
      address: "1 rue du Test",
      siret: overrides.siret ?? makeSiret(),
      phone: "0102030405",
      website: "https://jetable.fr",
      status: overrides.status ?? "PENDING",
      directorId: directorUserId,
    },
  });
}

async function cleanupDisposable(email: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.clinicRequest.deleteMany({
      where: { directorId: user.id },
    });
    await prisma.clinic.deleteMany({ where: { directorId: user.id } });
  }
  await prisma.refreshToken.deleteMany({ where: { user: { email } } });
  await prisma.user.deleteMany({ where: { email } });
}

// Le geocoding appelle une vraie API externe (Nominatim) : on mock fetch
// pour ne pas dépendre du réseau dans les tests d'approbation.
function mockGeocoding() {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    json: async () => [{ lat: "48.8566", lon: "2.3522" }],
  } as Response);
}

// ── GET /api/clinics/requests/status ────────────────────────────────────────

describe("GET /api/clinics/requests/status", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/clinics/requests/status");
    expect(res.status).toBe(401);
  });

  it("403 — rôle non-DIRECTOR", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .get("/api/clinics/requests/status")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("200 — NONE pour un directeur sans clinique ni demande", async () => {
    const { email } = await createDisposableDirector();
    try {
      const token = await loginAs(email);
      const res = await request(app)
        .get("/api/clinics/requests/status")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("NONE");
    } finally {
      await cleanupDisposable(email);
    }
  });

  it("200 — PENDING pour un directeur avec une demande en attente", async () => {
    const { userId, email } = await createDisposableDirector();
    await createDisposableRequest(userId, { status: "PENDING" });
    try {
      const token = await loginAs(email);
      const res = await request(app)
        .get("/api/clinics/requests/status")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("PENDING");
      expect(res.body.request).toBeTruthy();
    } finally {
      await cleanupDisposable(email);
    }
  });

  it("200 — REJECTED pour un directeur avec une demande refusée", async () => {
    const { userId, email } = await createDisposableDirector();
    await createDisposableRequest(userId, { status: "REJECTED" });
    try {
      const token = await loginAs(email);
      const res = await request(app)
        .get("/api/clinics/requests/status")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("REJECTED");
    } finally {
      await cleanupDisposable(email);
    }
  });

  it("200 — APPROVED pour un directeur avec une clinique", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .get("/api/clinics/requests/status")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("APPROVED");
    expect(res.body.clinic).toBeTruthy();
  });
});

// ── POST /api/clinics/requests/ ─────────────────────────────────────────────

describe("POST /api/clinics/requests/", () => {
  const validPayload = {
    name: "Nouvelle clinique",
    address: "5 rue du Test, Paris",
    siret: "",
    phone: "0102030405",
    website: "https://nouvelle-clinique.fr",
  };

  it("401 — sans token", async () => {
    const res = await request(app)
      .post("/api/clinics/requests/")
      .send({ ...validPayload, siret: makeSiret() });
    expect(res.status).toBe(401);
  });

  it("403 — rôle non-DIRECTOR", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .post("/api/clinics/requests/")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validPayload, siret: makeSiret() });
    expect(res.status).toBe(403);
  });

  it("400 — body invalide (siret incorrect)", async () => {
    const { email } = await createDisposableDirector();
    try {
      const token = await loginAs(email);
      const res = await request(app)
        .post("/api/clinics/requests/")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validPayload, siret: "123" });
      expect(res.status).toBe(400);
    } finally {
      await cleanupDisposable(email);
    }
  });

  it("400 — le directeur a déjà une clinique approuvée", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .post("/api/clinics/requests/")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validPayload, siret: makeSiret() });
    expect(res.status).toBe(400);
  });

  it("409 — le directeur a déjà une demande en attente", async () => {
    const { userId, email } = await createDisposableDirector();
    await createDisposableRequest(userId, { status: "PENDING" });
    try {
      const token = await loginAs(email);
      const res = await request(app)
        .post("/api/clinics/requests/")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validPayload, siret: makeSiret() });
      expect(res.status).toBe(409);
    } finally {
      await cleanupDisposable(email);
    }
  });

  it("409 — siret déjà utilisé par une clinique existante", async () => {
    const { email } = await createDisposableDirector();
    const existingClinic = await getPrisma().clinic.findFirst();
    try {
      const token = await loginAs(email);
      const res = await request(app)
        .post("/api/clinics/requests/")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validPayload, siret: existingClinic!.siret });
      expect(res.status).toBe(409);
    } finally {
      await cleanupDisposable(email);
    }
  });

  it("409 — siret déjà utilisé par une demande en attente d'un autre directeur", async () => {
    const other = await createDisposableDirector();
    const siret = makeSiret();
    await createDisposableRequest(other.userId, { status: "PENDING", siret });

    const { email } = await createDisposableDirector();
    try {
      const token = await loginAs(email);
      const res = await request(app)
        .post("/api/clinics/requests/")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validPayload, siret });
      expect(res.status).toBe(409);
    } finally {
      await cleanupDisposable(email);
      await cleanupDisposable(other.email);
    }
  });

  it("201 — crée une nouvelle demande", async () => {
    const { email } = await createDisposableDirector();
    try {
      const token = await loginAs(email);
      const siret = makeSiret();
      const res = await request(app)
        .post("/api/clinics/requests/")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validPayload, siret });
      console.log(res.body);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("status", "PENDING");
      expect(res.body).toHaveProperty("request");
      expect(res.body.request).toHaveProperty("siret", siret);
    } finally {
      await cleanupDisposable(email);
    }
  });
});

// ── GET /api/clinics/requests/ ───────────────────────────────────────────────

describe("GET /api/clinics/requests/", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get("/api/clinics/requests/");
    expect(res.status).toBe(401);
  });

  it("403 — rôle non-ADMIN/DIRECTOR", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .get("/api/clinics/requests/")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("200 — ADMIN retourne toutes les demandes", async () => {
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .get("/api/clinics/requests/")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("200 — DIRECTOR retourne uniquement ses propres demandes", async () => {
    const { userId, email } = await createDisposableDirector();
    await createDisposableRequest(userId, { status: "PENDING" });
    try {
      const token = await loginAs(email);
      const res = await request(app)
        .get("/api/clinics/requests/")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(
        res.body.every((r: { directorId: string }) => r.directorId === userId),
      ).toBe(true);
    } finally {
      await cleanupDisposable(email);
    }
  });
});

// ── GET /api/clinics/requests/:id/approve ───────────────────────────────────

describe("GET /api/clinics/requests/:id/approve", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get(
      `/api/clinics/requests/${randomUUID()}/approve`,
    );
    expect(res.status).toBe(401);
  });

  it("403 — rôle DIRECTOR non autorisé (même pour sa propre demande)", async () => {
    const { userId, email } = await createDisposableDirector();
    const req = await createDisposableRequest(userId, { status: "PENDING" });
    try {
      const token = await loginAs(email);
      const res = await request(app)
        .get(`/api/clinics/requests/${req.id}/approve`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    } finally {
      await cleanupDisposable(email);
    }
  });

  it("404 — demande introuvable", async () => {
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .get(`/api/clinics/requests/${randomUUID()}/approve`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("400 — demande déjà traitée", async () => {
    const { userId, email } = await createDisposableDirector();
    const req = await createDisposableRequest(userId, { status: "REJECTED" });
    try {
      const token = await loginAs("admin@gmail.com");
      const res = await request(app)
        .get(`/api/clinics/requests/${req.id}/approve`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    } finally {
      await cleanupDisposable(email);
    }
  });

  it("409 — siret déjà utilisé par une clinique existante", async () => {
    const { userId, email } = await createDisposableDirector();
    const existingClinic = await getPrisma().clinic.findFirst();
    const req = await createDisposableRequest(userId, {
      status: "PENDING",
      siret: existingClinic!.siret,
    });
    try {
      const token = await loginAs("admin@gmail.com");
      const res = await request(app)
        .get(`/api/clinics/requests/${req.id}/approve`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(409);
    } finally {
      await cleanupDisposable(email);
    }
  });

  it("200 — approuve la demande et crée la clinique", async () => {
    const { userId, email } = await createDisposableDirector();
    const siret = makeSiret();
    const req = await createDisposableRequest(userId, {
      status: "PENDING",
      siret,
    });
    const fetchSpy = mockGeocoding();

    try {
      const token = await loginAs("admin@gmail.com");
      const res = await request(app)
        .get(`/api/clinics/requests/${req.id}/approve`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);

      const updatedRequest = await getPrisma().clinicRequest.findUnique({
        where: { id: req.id },
      });
      expect(updatedRequest?.status).toBe("APPROVED");

      const createdClinic = await getPrisma().clinic.findUnique({
        where: { siret },
      });
      expect(createdClinic).not.toBeNull();
      expect(createdClinic?.directorId).toBe(userId);
    } finally {
      fetchSpy.mockRestore();
      await cleanupDisposable(email);
    }
  });
});

// ── GET /api/clinics/requests/:id/reject ────────────────────────────────────

describe("GET /api/clinics/requests/:id/reject", () => {
  it("401 — sans token", async () => {
    const res = await request(app).get(
      `/api/clinics/requests/${randomUUID()}/reject`,
    );
    expect(res.status).toBe(401);
  });

  it("403 — rôle DIRECTOR non autorisé", async () => {
    const { userId, email } = await createDisposableDirector();
    const req = await createDisposableRequest(userId, { status: "PENDING" });
    try {
      const token = await loginAs(email);
      const res = await request(app)
        .get(`/api/clinics/requests/${req.id}/reject`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    } finally {
      await cleanupDisposable(email);
    }
  });

  it("404 — demande introuvable", async () => {
    const token = await loginAs("admin@gmail.com");
    const res = await request(app)
      .get(`/api/clinics/requests/${randomUUID()}/reject`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("200 — rejette la demande", async () => {
    const { userId, email } = await createDisposableDirector();
    const req = await createDisposableRequest(userId, { status: "PENDING" });
    try {
      const token = await loginAs("admin@gmail.com");
      const res = await request(app)
        .get(`/api/clinics/requests/${req.id}/reject`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);

      const updatedRequest = await getPrisma().clinicRequest.findUnique({
        where: { id: req.id },
      });
      expect(updatedRequest?.status).toBe("REJECTED");
    } finally {
      await cleanupDisposable(email);
    }
  });
});
