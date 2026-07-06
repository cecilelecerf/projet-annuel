// setup.ts — setupFiles, pour getPrisma() dans les tests
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __PRISMA_TEST_CLIENT__: PrismaClient | undefined;
}

/**
 * Singleton partagé au niveau du processus (globalThis), et non du module.
 *
 * Pourquoi globalThis et pas une simple variable de module :
 * Vitest isole chaque fichier de test dans son propre graphe de modules
 * par défaut (`isolate: true`). Ça veut dire que `setup.ts` est ré-exécuté
 * à chaque fichier, et qu'une variable de module classique (`let _prisma`)
 * serait donc réinitialisée à chaque fois — recréant un nouveau
 * PrismaClient (et son pool de connexions pg) par fichier.
 *
 * `globalThis`, en revanche, persiste au sein d'un même processus/worker
 * Vitest, quel que soit le nombre de fois où le module est ré-importé.
 * Un seul PrismaClient est donc créé par worker, peu importe le nombre
 * de fichiers de test qu'il exécute.
 */
export const getPrisma = (): PrismaClient => {
  if (!globalThis.__PRISMA_TEST_CLIENT__) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
      max: 5,
    });
    globalThis.__PRISMA_TEST_CLIENT__ = new PrismaClient({ adapter });
  }
  return globalThis.__PRISMA_TEST_CLIENT__;
};
