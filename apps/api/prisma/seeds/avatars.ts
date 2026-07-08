// seed/utils/seedAvatar.ts
import { readFile } from "node:fs/promises";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "../generated/prisma/client";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getS3Client() {
  const bucket = process.env.S3_BUCKET;
  const endpoint = process.env.S3_ENDPOINT;

  if (!bucket || !endpoint) return null;

  return {
    bucket,
    client: new S3Client({
      region: process.env.AWS_REGION ?? "us-east-1",
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    }),
  };
}

/**
 * Upload un fichier local vers MinIO, crée le `File` correspondant,
 * et lie `avatarId` sur le user. À utiliser uniquement en seed.
 *
 * En l'absence de config S3 (ex: CI sans MinIO), cette fonction est un
 * no-op silencieux : le user reste simplement sans avatar.
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
  const s3 = getS3Client();
  if (!s3) {
    console.log(`⏭️  S3 non configuré, avatar ignoré pour ${userId}`);
    return null;
  }

  const absolutePath = path.resolve(__dirname, localImagePath);
  const buffer = await readFile(absolutePath);
  const key = `users/${userId}/${crypto.randomUUID()}`;

  await s3.client.send(
    new PutObjectCommand({
      Bucket: s3.bucket,
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
