import { z } from "zod";

// ── Carte d'urgence : fiche publique (sans authentification) accessible via
// le jeton emergencyToken d'un animal, pensée pour être scannée (QR/NFC) par
// quelqu'un qui retrouve l'animal perdu ────────────────────────────────────

export const animalEmergencyCardSchema = z.object({
  name: z.string(),
  photoUrl: z.url().nullable(),
  species: z.string(),
  breed: z.string(),
  dateOfBirth: z.coerce.date(),
  healthConditions: z.array(
    z.object({
      name: z.string(),
      notes: z.string(),
    }),
  ),
  owner: z.object({
    name: z.string(),
    phone: z.string().nullable(),
  }),
  clinic: z
    .object({
      name: z.string(),
      phone: z.string(),
      address: z.string(),
    })
    .nullable(),
});
export type AnimalEmergencyCard = z.infer<typeof animalEmergencyCardSchema>;

// ── QR code de la carte d'urgence, généré côté serveur (authentifié, propriétaire) ──

export const animalEmergencyQrSchema = z.object({
  url: z.url(),
  qrCodeDataUrl: z.string(),
});
export type AnimalEmergencyQr = z.infer<typeof animalEmergencyQrSchema>;
