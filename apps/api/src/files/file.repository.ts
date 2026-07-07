import { PrismaClient } from "../../prisma/generated/prisma/client";
import type {
  File,
  FileEntityType,
  FileType,
} from "../../prisma/generated/prisma/client";

export class FileRepository {
  constructor(private prisma: PrismaClient) {}

  async create({
    storageKey,
    mimeType,
    size,
    type,
    entityType,
    entityId,
  }: {
    storageKey: string;
    mimeType: string;
    size?: number;
    type: FileType;
    entityType: FileEntityType;
    entityId: string;
  }): Promise<File> {
    return this.prisma.file.create({
      data: {
        storageKey,
        mimeType,
        size,
        type,
        entityType,
        entityId,
      },
    });
  }

  async findById(id: string): Promise<File | null> {
    return this.prisma.file.findUnique({
      where: {
        id,
      },
    });
  }

  async findByEntity({
    entityType,
    entityId,
  }: {
    entityType: FileEntityType;
    entityId: string;
  }): Promise<File[]> {
    return this.prisma.file.findMany({ where: { entityType, entityId } });
  }
  async delete(id: string): Promise<File> {
    return this.prisma.file.delete({
      where: {
        id,
      },
    });
  }

  async update(id: string, data: Partial<Pick<File, "size">>): Promise<File> {
    return this.prisma.file.update({ where: { id }, data });
  }
}
