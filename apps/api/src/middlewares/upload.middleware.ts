import { existsSync, mkdirSync } from "fs";
import { resolve, extname } from "path";
import multer from "multer";
import { BadRequestError } from "@api/errors";

const UPLOADS_ROOT = resolve(process.cwd(), "uploads");
const CLINIC_IMAGES_DIR = resolve(UPLOADS_ROOT, "clinics");

if (!existsSync(CLINIC_IMAGES_DIR)) {
  mkdirSync(CLINIC_IMAGES_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CLINIC_IMAGES_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

export const uploadClinicImage = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new BadRequestError("Format d'image non supporté (jpeg, png, webp uniquement)"));
      return;
    }
    cb(null, true);
  },
}).single("image");

export function clinicImagePublicPath(filename: string): string {
  return `/uploads/clinics/${filename}`;
}
