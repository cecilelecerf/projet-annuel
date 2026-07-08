// globalSetup.ts — tourne avant tous les imports
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { execSync } from "child_process";
import {
  S3Client,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { MinioContainer, StartedMinioContainer } from "@testcontainers/minio";

declare global {
  // eslint-disable-next-line no-var
  var __pgContainer__: StartedPostgreSqlContainer | undefined;
  // eslint-disable-next-line no-var
  var __minioContainer__: StartedMinioContainer | undefined;
}

export async function setup() {
  const postgresContainer = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("test_db")
    .withUsername("test")
    .withPassword("test")
    .start();
  const url = postgresContainer.getConnectionUri();
  process.env.DATABASE_URL = url;

  // MinIO — nouveau
  const minioContainer = await new MinioContainer("minio/minio:latest").start();

  process.env.S3_ENDPOINT = `http://${minioContainer.getHost()}:${minioContainer.getMappedPort(9000)}`;
  process.env.S3_BUCKET = "test-bucket";
  process.env.AWS_REGION = "us-east-1";
  process.env.AWS_ACCESS_KEY_ID = minioContainer.getUsername();
  process.env.AWS_SECRET_ACCESS_KEY = minioContainer.getPassword();
  process.env.ASSETS_BASE_URL = `${process.env.S3_ENDPOINT}/test-bucket`;

  // Créer le bucket + policy publique en lecture, équivalent au minio-init de dev
  const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  await s3.send(new CreateBucketCommand({ Bucket: "test-bucket" }));
  await s3.send(
    new PutBucketPolicyCommand({
      Bucket: "test-bucket",
      Policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: ["arn:aws:s3:::test-bucket/users/*"],
          },
        ],
      }),
    }),
  );

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "inherit",
  });
  execSync("pnpm tsx prisma/seeds/index.ts", {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "inherit",
  });

  console.log("✅ Seed terminé");

  globalThis.__pgContainer__ = postgresContainer;
  globalThis.__minioContainer__ = minioContainer;
}

export async function teardown() {
  await globalThis.__pgContainer__?.stop();
  await globalThis.__minioContainer__?.stop();
}
