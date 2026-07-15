import { z } from "zod";

export const contactMessageSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(255),
  email: z.email("Email invalide").max(255),
  subject: z.string().min(1, "Le sujet est requis").max(255),
  message: z
    .string()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(5000),
});
export type ContactMessage = z.infer<typeof contactMessageSchema>;
