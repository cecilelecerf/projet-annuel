import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "@api/app";
import { getPrisma } from "../../../__tests__/setup";

// 1x1 PNG transparent, valide pour les tests d'upload.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const loginAs = async (email: string, password = "Password123!") => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res.body.accessToken as string;
};

describe("POST /api/clinics/me/image", () => {
  it("401 — sans token", async () => {
    const res = await request(app)
      .post("/api/clinics/me/image")
      .attach("image", TINY_PNG, "clinic.png");
    expect(res.status).toBe(401);
  });

  it("403 — rôle VETERINARIAN non autorisé", async () => {
    const token = await loginAs("veto@gmail.com");
    const res = await request(app)
      .post("/api/clinics/me/image")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", TINY_PNG, "clinic.png");
    expect(res.status).toBe(403);
  });

  it("400 — aucune image fournie", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .post("/api/clinics/me/image")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("400 — format de fichier non supporté", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .post("/api/clinics/me/image")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", Buffer.from("not an image"), "clinic.txt");
    expect(res.status).toBe(400);
  });

  it("200 — DIRECTOR met à jour l'image de sa clinique", async () => {
    const token = await loginAs("directeur@gmail.com");
    const res = await request(app)
      .post("/api/clinics/me/image")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", TINY_PNG, "clinic.png");
    expect(res.status).toBe(200);
    expect(res.body.image).toMatch(/^\/uploads\/clinics\/.+\.png$/);

    const director = await getPrisma().user.findUnique({
      where: { email: "directeur@gmail.com" },
      include: { directorClinicProfile: { include: { clinic: true } } },
    });
    expect(director!.directorClinicProfile!.clinic.image).toBe(
      res.body.image,
    );
  });

  it("200 — REFERANT met à jour l'image de sa clinique", async () => {
    const token = await loginAs("referent@gmail.com");
    const res = await request(app)
      .post("/api/clinics/me/image")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", TINY_PNG, "clinic.png");
    expect(res.status).toBe(200);
    expect(res.body.image).toMatch(/^\/uploads\/clinics\/.+\.png$/);
  });
});
