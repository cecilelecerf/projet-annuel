import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ForbiddenError, ValidationError } from "@api/errors";

// ═══════════════════════════════════════════════════════════════
// Mocks — hoisted pour être disponibles avant les vi.mock() ci-dessous
// ═══════════════════════════════════════════════════════════════

const { mockRepository } = vi.hoisted(() => ({
  mockRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findByEntity: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
}));

const { mockSend, mockGetSignedUrl } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockGetSignedUrl: vi.fn(),
}));

vi.mock("../file.repository", () => ({
  FileRepository: vi.fn(function () {
    return mockRepository;
  }),
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(function () {
    return { send: mockSend };
  }),
  PutObjectCommand: vi.fn(function (input) {
    return { input, __type: "PutObjectCommand" };
  }),
  GetObjectCommand: vi.fn(function (input) {
    return { input, __type: "GetObjectCommand" };
  }),
  HeadObjectCommand: vi.fn(function (input) {
    return { input, __type: "HeadObjectCommand" };
  }),
  DeleteObjectCommand: vi.fn(function (input) {
    return { input, __type: "DeleteObjectCommand" };
  }),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

// Import après les mocks (vitest hoiste automatiquement les vi.mock, mais on garde l'ordre lisible)
import { FileService } from "../file.service";
import { FileRepository } from "../file.repository";

describe("FileService", () => {
  let service: FileService;

  const baseFile = {
    id: "file-1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    storageKey: "users/user-1/uuid-abc",
    mimeType: "image/png",
    size: null,
    type: "IMAGE" as const,
    entityType: "USER" as const,
    entityId: "user-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    process.env.S3_BUCKET = "test-bucket";
    process.env.S3_ENDPOINT = "http://localhost:9000";
    process.env.AWS_REGION = "us-east-1";
    process.env.AWS_ACCESS_KEY_ID = "test";
    process.env.AWS_SECRET_ACCESS_KEY = "test";
    process.env.ASSETS_BASE_URL = "http://localhost:9000/test-bucket";

    service = new FileService(new FileRepository({} as never));
  });

  // ═══════════════════════════════════════════════════════════════
  // Constructor
  // ═══════════════════════════════════════════════════════════════

  describe("constructor", () => {
    it("throws if S3_BUCKET is missing", () => {
      delete process.env.S3_BUCKET;
      expect(() => new FileService(new FileRepository({} as never))).toThrow(
        "S3_BUCKET is missing",
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // createUpload
  // ═══════════════════════════════════════════════════════════════

  describe("createUpload", () => {
    it("throws ValidationError for a disallowed mime type", async () => {
      await expect(
        service.createUpload({
          entityType: "USER",
          entityId: "user-1",
          mimeType: "application/pdf",
          type: "IMAGE",
        }),
      ).rejects.toThrow(ValidationError);

      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it("creates a File with a pluralized entityType prefix in the storage key", async () => {
      mockRepository.create.mockResolvedValue(baseFile);
      mockGetSignedUrl.mockResolvedValue("https://signed-upload-url");

      await service.createUpload({
        entityType: "USER",
        entityId: "user-1",
        mimeType: "image/png",
        type: "IMAGE",
      });

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          storageKey: expect.stringMatching(/^users\/user-1\/[a-f0-9-]+$/),
          mimeType: "image/png",
          type: "IMAGE",
          entityType: "USER",
          entityId: "user-1",
        }),
      );
    });

    it("returns the fileId and a presigned upload url", async () => {
      mockRepository.create.mockResolvedValue(baseFile);
      mockGetSignedUrl.mockResolvedValue("https://signed-upload-url");

      const result = await service.createUpload({
        entityType: "USER",
        entityId: "user-1",
        mimeType: "image/png",
        type: "IMAGE",
      });

      expect(result).toEqual({
        fileId: baseFile.id,
        uploadUrl: "https://signed-upload-url",
      });
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ __type: "PutObjectCommand" }),
        { expiresIn: 60 * 5 },
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // createUploadUrl / createDownloadUrl
  // ═══════════════════════════════════════════════════════════════

  describe("createUploadUrl", () => {
    it("signs a PutObjectCommand with the given key and content type", async () => {
      mockGetSignedUrl.mockResolvedValue("https://signed-upload-url");

      const url = await service.createUploadUrl(
        "users/user-1/key",
        "image/webp",
      );

      expect(url).toBe("https://signed-upload-url");
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          __type: "PutObjectCommand",
          input: expect.objectContaining({
            Bucket: "test-bucket",
            Key: "users/user-1/key",
            ContentType: "image/webp",
          }),
        }),
        { expiresIn: 60 * 5 },
      );
    });
  });

  describe("createDownloadUrl", () => {
    it("signs a GetObjectCommand with the given key", async () => {
      mockGetSignedUrl.mockResolvedValue("https://signed-download-url");

      const url = await service.createDownloadUrl("users/user-1/key");

      expect(url).toBe("https://signed-download-url");
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          __type: "GetObjectCommand",
          input: expect.objectContaining({
            Bucket: "test-bucket",
            Key: "users/user-1/key",
          }),
        }),
        { expiresIn: 60 * 5 },
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // confirmUpload
  // ═══════════════════════════════════════════════════════════════

  describe("confirmUpload", () => {
    it("throws NotFoundError if the file does not exist", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.confirmUpload({
          fileId: "missing",
          expectedEntityType: "USER",
          expectedEntityId: "user-1",
        }),
      ).rejects.toThrow(NotFoundError);

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("throws ForbiddenError if entityType does not match", async () => {
      mockRepository.findById.mockResolvedValue({
        ...baseFile,
        entityType: "ANIMAL",
      });

      await expect(
        service.confirmUpload({
          fileId: baseFile.id,
          expectedEntityType: "USER",
          expectedEntityId: "user-1",
        }),
      ).rejects.toThrow(ForbiddenError);

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("throws ForbiddenError if entityId does not match", async () => {
      mockRepository.findById.mockResolvedValue({
        ...baseFile,
        entityId: "other-user",
      });

      await expect(
        service.confirmUpload({
          fileId: baseFile.id,
          expectedEntityType: "USER",
          expectedEntityId: "user-1",
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("throws ValidationError and cleans up if the uploaded file exceeds the max size", async () => {
      mockRepository.findById.mockResolvedValue(baseFile);
      mockSend.mockResolvedValue({ ContentLength: 10 * 1024 * 1024 }); // 10 Mo > limite 5 Mo

      await expect(
        service.confirmUpload({
          fileId: baseFile.id,
          expectedEntityType: "USER",
          expectedEntityId: "user-1",
        }),
      ).rejects.toThrow(ValidationError);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ __type: "DeleteObjectCommand" }),
      );
      expect(mockRepository.delete).toHaveBeenCalledWith(baseFile.id);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it("updates the file size and returns it when the upload is valid", async () => {
      mockRepository.findById.mockResolvedValue(baseFile);
      mockSend.mockResolvedValue({ ContentLength: 2048 });
      mockRepository.update.mockResolvedValue({ ...baseFile, size: 2048 });

      const result = await service.confirmUpload({
        fileId: baseFile.id,
        expectedEntityType: "USER",
        expectedEntityId: "user-1",
      });

      expect(mockRepository.update).toHaveBeenCalledWith(baseFile.id, {
        size: 2048,
      });
      expect(result.size).toBe(2048);
    });

    it("propagates the error if the object does not exist on S3 (HeadObject rejects)", async () => {
      mockRepository.findById.mockResolvedValue(baseFile);
      mockSend.mockRejectedValue(new Error("NotFound"));

      await expect(
        service.confirmUpload({
          fileId: baseFile.id,
          expectedEntityType: "USER",
          expectedEntityId: "user-1",
        }),
      ).rejects.toThrow("NotFound");

      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // deleteFromStorage / deleteFile
  // ═══════════════════════════════════════════════════════════════

  describe("deleteFromStorage", () => {
    it("sends a DeleteObjectCommand with the given key", async () => {
      mockSend.mockResolvedValue({});

      await service.deleteFromStorage("users/user-1/key");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __type: "DeleteObjectCommand",
          input: expect.objectContaining({
            Bucket: "test-bucket",
            Key: "users/user-1/key",
          }),
        }),
      );
    });
  });

  describe("deleteFile", () => {
    it("does nothing if the file does not exist", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await service.deleteFile("missing");

      expect(mockSend).not.toHaveBeenCalled();
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it("deletes the object from storage and the File row if it exists", async () => {
      mockRepository.findById.mockResolvedValue(baseFile);
      mockSend.mockResolvedValue({});

      await service.deleteFile(baseFile.id);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __type: "DeleteObjectCommand",
          input: expect.objectContaining({ Key: baseFile.storageKey }),
        }),
      );
      expect(mockRepository.delete).toHaveBeenCalledWith(baseFile.id);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // publicUrl
  // ═══════════════════════════════════════════════════════════════

  describe("publicUrl", () => {
    it("concatenates ASSETS_BASE_URL and the storage key", () => {
      const url = service.publicUrl("users/user-1/key");
      expect(url).toBe("http://localhost:9000/test-bucket/users/user-1/key");
    });
  });
});
