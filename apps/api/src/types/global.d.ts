import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

export {};

declare global {
  var __pgContainer__: StartedPostgreSqlContainer | undefined;
}
