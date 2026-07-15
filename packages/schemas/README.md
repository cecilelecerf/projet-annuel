# 📂 Schemas

Package partagé (`@armali/schemas`) contenant les **schémas Zod** utilisés à la fois par [`apps/api`](../../apps/api/README.md) (validation des entrées/sorties) et [`apps/web`](../../apps/web/README.md) (typage des appels API, formulaires). Source unique de vérité pour la forme des données échangées entre le front et l'API.

📎 Voir aussi : [README racine](../../README.md) · [`apps/api/README.md`](../../apps/api/README.md) · [`apps/web/README.md`](../../apps/web/README.md)

---

## 📁 Structure

```
packages/schemas/
├── src/
│   ├── <feature>/
│   │   ├── <feature>.schema.ts   # Schémas Zod (input + output)
│   │   ├── <feature>.types.ts    # Types inférés (z.infer<typeof ...>)
│   │   └── index.ts              # Ré-export public de la feature
│   └── index.ts                  # Barrel export du package
├── package.json
├── tsconfig.json
└── tsup.config.ts                # Build (ESM/CJS + types)
```

---

## 🎯 Rôle du package

- Définit la **forme des données** (requêtes et réponses) une seule fois, consommée à la fois par l'API (validation runtime) et le web (typage + validation formulaires).
- Évite la duplication et la divergence entre le type attendu côté API et le type utilisé côté front.
- Les types TypeScript ne sont **jamais écrits à la main** pour une entité partagée : ils sont toujours inférés depuis le schéma Zod (`z.infer<typeof animalSchema>`), pour garantir que type et validation runtime restent synchronisés.

---

## 🏷️ Conventions de nommage

| Schéma                       | Convention                                       | Exemple                                                |
| ---------------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| Entité complète (sortie API) | `<Entity>Schema`                                 | `animalSchema`                                         |
| Création (entrée)            | `<Entity>CreateSchema` ou `create<Entity>Schema` | `animalCreateSchema`                                   |
| Mise à jour (entrée)         | `<Entity>UpdateSchema`                           | `animalUpdateSchema`                                   |
| Paramètres de route          | `<entity>ParamsSchema`                           | `animalParamsSchema` (ex. `{ id: z.string().uuid() }`) |
| Query params / filtres       | `<entity>QuerySchema`                            | `animalQuerySchema`                                    |
| Type inféré                  | `PascalCase`, sans suffixe `Schema`              | `type Animal = z.infer<typeof animalSchema>`           |

- Un fichier `<feature>.schema.ts` par feature, aligné sur le découpage de `apps/api/src/features/<feature>/`.
- Toujours exporter le **schéma** ET le **type inféré** associé, jamais l'un sans l'autre.
- Les schémas de sortie (réponse API) doivent refléter exactement la forme construite par le service correspondant côté API — toute divergence de nom de champ entre le service et le schéma casse la validation (`invalid_type`).

---

## ✍️ Bonnes pratiques

- **Composition plutôt que duplication** : un schéma de mise à jour dérive du schéma de création via `.partial()` plutôt que d'être réécrit à la main.

  ```typescript
  export const animalCreateSchema = z.object({
    name: z.string().min(1),
    dateOfBirth: z.coerce.date(),
    // ...
  });

  export const animalUpdateSchema = animalCreateSchema.partial();
  ```

- **Schémas imbriqués réutilisables** : factoriser les sous-objets répétés (ex. `userSchema`, `clinicSchema`) dans leur propre fichier de feature et les composer via `.extend()` ou en tant que champ, plutôt que de redéfinir la forme à chaque usage.
- **Un schéma de sortie par niveau de détail** si une entité est retournée sous plusieurs formes (liste vs détail) : `animalListItemSchema` vs `animalDetailSchema`, plutôt qu'un seul schéma avec des champs optionnels selon le contexte.
- **Messages d'erreur explicites** en français pour les champs visibles côté formulaire (`z.string().min(1, "Le nom est requis")`), utiles pour l'affichage direct dans `apps/web`.
- **Pas de logique métier** dans un schéma (pas d'appel réseau, pas de règle d'autorisation) — uniquement de la forme et des contraintes de valeur.

---

## 📦 Utilisation dans les autres workspaces

```typescript
// apps/api
import { animalSchema, animalCreateSchema } from "@armali/schemas";

// apps/web
import { animalSchema, type Animal } from "@armali/schemas";
```

> ⚠️ `@armali/schemas` doit rester en `dependencies` (pas `devDependencies`) dans `api` et `web` : il est importé à l'exécution, et le build de prod fait `pnpm install --prod` qui exclut les `devDependencies` (voir [README racine](../../README.md)).

---

## 🚀 Scripts

| Commande                                  | Description                          |
| ----------------------------------------- | ------------------------------------ |
| `pnpm --filter @armali/schemas run build` | Build le package (types + JS)        |
| `pnpm --filter @armali/schemas run dev`   | Watch build pendant le développement |

> Depuis la racine : `pnpm dev:schemas`, `pnpm add:schemas <package>` (voir [README racine](../../README.md)).

Après toute modification d'un schéma, relance le build (`pnpm dev:schemas` en watch, ou `pnpm --filter @armali/schemas run build`) pour que les workspaces `api`/`web` récupèrent la nouvelle version des types en local.

---

## ⚠️ Breaking changes

Ce package est un point de couplage fort entre `api` et `web` : renommer un champ, changer un type, ou resserrer une contrainte de validation peut casser silencieusement l'autre workspace tant que les tests ne sont pas relancés.

- Vérifier les usages du schéma modifié dans **les deux** workspaces avant de merger.
- Les tests de route de l'API (`*.router.test.ts`) valident déjà la réponse contre le schéma de sortie — un changement incompatible doit faire échouer ces tests avant d'atteindre `main`.
