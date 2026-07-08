import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { FileEntityType, FileType } from "../../prisma/generated/prisma/enums";
import { File } from "../../prisma/generated/prisma/client";
import { FileRepository } from "./file.repository";
import { NotFoundError, ForbiddenError, ValidationError } from "@api/errors";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export class FileService {
  private s3Internal: S3Client;
  private s3Public: S3Client;

  private bucket: string;

  constructor(private repository: FileRepository) {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) throw new Error("S3_BUCKET is missing");
    this.bucket = bucket;
    this.s3Internal = new S3Client({
      endpoint: process.env.S3_ENDPOINT, // http://minio:9000
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
      requestChecksumCalculation: "WHEN_REQUIRED",
    });

    this.s3Public = new S3Client({
      endpoint: process.env.S3_PUBLIC_ENDPOINT, // https://s3.armali.online
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
      requestChecksumCalculation: "WHEN_REQUIRED",
    });
  }

  async createUpload({
    entityType,
    entityId,
    mimeType,
    type,
  }: {
    entityType: FileEntityType;
    entityId: string;
    mimeType: string;
    type: FileType;
  }) {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new ValidationError("Format de fichier non supporté");
    }
    const prefix = `${entityType.toLowerCase()}s`; // USER → users, ANIMAL → animals, BRAND → brands
    const key = `${prefix}/${entityId}/${crypto.randomUUID()}`;

    const file = await this.repository.create({
      storageKey: key,
      mimeType,
      type,
      entityType,
      entityId,
    });

    const uploadUrl = await this.createUploadUrl(key, mimeType);

    return { fileId: file.id, uploadUrl };
  }

  async createUploadUrl(key: string, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3Public, command, { expiresIn: 60 * 5 });
  }

  async createDownloadUrl(key: string) {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3Internal, command, { expiresIn: 60 * 5 });
  }

  /**
   * Vérifie que le fichier appartient bien à l'entité attendue,
   * confirme sa présence réelle sur S3 (HeadObject) et persiste la taille réelle.
   */
  async confirmUpload({
    fileId,
    expectedEntityType,
    expectedEntityId,
  }: {
    fileId: string;
    expectedEntityType: FileEntityType;
    expectedEntityId: string;
  }): Promise<File> {
    const file = await this.repository.findById(fileId);
    if (!file) throw new NotFoundError("Fichier");

    if (
      file.entityType !== expectedEntityType ||
      file.entityId !== expectedEntityId
    ) {
      throw new ForbiddenError();
    }

    const head = await this.s3Internal.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: file.storageKey }),
    );
    // HeadObjectCommand rejette (404) si l'objet n'existe pas encore sur S3

    if (head.ContentLength && head.ContentLength > MAX_SIZE_BYTES) {
      await this.deleteFromStorage(file.storageKey);
      await this.repository.delete(file.id);
      throw new ValidationError("Fichier trop volumineux");
    }

    return this.repository.update(file.id, {
      size: head.ContentLength ?? undefined,
    });
  }

  async deleteFromStorage(key: string) {
    await this.s3Internal.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async deleteFile(fileId: string) {
    const file = await this.repository.findById(fileId);
    if (!file) return;
    await this.deleteFromStorage(file.storageKey);
    await this.repository.delete(fileId);
  }

  publicUrl(key: string) {
    // Option A : bucket/CloudFront public en lecture
    return `${process.env.ASSETS_BASE_URL}/${key}`;
  }
}
