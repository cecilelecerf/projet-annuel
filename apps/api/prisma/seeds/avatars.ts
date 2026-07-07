// seed/utils/seedAvatar.ts
import { readFile } from "node:fs/promises";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "../generated/prisma/client";

import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
dotenv.config();
const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const bucket = process.env.S3_BUCKET!;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/**
 * Upload un fichier local vers MinIO, crée le `File` correspondant,
 * et lie `avatarId` sur le user. À utiliser uniquement en seed.
 */
export async function seedAvatar(
  prisma: PrismaClient,
  {
    userId,
    localImagePath,
    mimeType = "image/jpeg",
  }: {
    userId: string;
    localImagePath: string;
    mimeType?: string;
  },
) {
  const absolutePath = path.resolve(__dirname, localImagePath);
  console.log("Lecture depuis:", absolutePath); // debug temporaire

  const buffer = await readFile(absolutePath);
  const key = `users/${userId}/${crypto.randomUUID()}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }),
  );

  const file = await prisma.file.create({
    data: {
      storageKey: key,
      mimeType,
      size: buffer.byteLength,
      type: "IMAGE",
      entityType: "USER",
      entityId: userId,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { avatarId: file.id },
  });

  return file;
}
