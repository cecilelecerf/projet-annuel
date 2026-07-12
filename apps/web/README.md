# 📂 Web

Frontend du projet — **Vue 3** (`<script setup>`), **Vue Router**, **Pinia**, **Element Plus**.

📎 Voir aussi : [README racine](../../README.md) · [`apps/api/README.md`](../api/README.md) · [`packages/schemas/README.md`](../../packages/schemas/README.md)

---

## 📁 Structure

```
apps/web/
├── src/
│   ├── main.ts                # Point d'entrée Vue
│   ├── router/                 # Vue Router — déclaration des routes globales
│   ├── stores/                 # Pinia stores globaux (auth, session, etc.)
│   ├── layouts/                # Layouts par rôle (ClientLayout, VetLayout, ...)
│   ├── components/             # Composants réutilisables transverses (design system, UI générique)
│   └── features/                # Organisation par feature (feature-based)
│       └── <feature>/
│           ├── api.ts               # Appels API de la feature
│           ├── utils.ts             # Fonctions utilitaires de la feature
│           ├── views/               # Pages de la feature
│           ├── components/          # Composants spécifiques à la feature
│           └── composables/          # Composables (logique réactive réutilisable)
├── nginx.conf                  # Config nginx (prod)
└── package.json
```

> 💡 Un composant/composable ne monte dans `src/components` ou `src/composables` (racine) que s'il est réellement **transverse** (utilisé par au moins deux features). Sinon il reste dans `features/<feature>/`.

---

## 🏷️ Conventions de nommage

### Fichiers `.vue`

| Type       | Convention                                                                                                  | Exemple                                      |
| ---------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Composant  | `PascalCase`, nom **multi-mots** (jamais un seul mot, pour éviter tout conflit avec une balise HTML native) | `AnimalCard.vue`, `VaccineList.vue`          |
| Page / vue | `PascalCase`, suffixe `View`                                                                                | `AnimalDetailView.vue`, `ClinicListView.vue` |
| Layout     | `PascalCase`, suffixe `Layout`                                                                              | `ClientLayout.vue`, `VeterinarianLayout.vue` |

### Fichiers `.ts`

| Type          | Convention                                                                      | Exemple                                       |
| ------------- | ------------------------------------------------------------------------------- | --------------------------------------------- |
| Composable    | `camelCase`, préfixe `use`                                                      | `useAnimal.ts`, `useClinicSearch.ts`          |
| Store (Pinia) | `camelCase`, nommé par domaine ; le store exporté suit `useXStore`              | `auth.ts` → `export const useAuthStore = ...` |
| Utilitaire    | `camelCase`, verbe ou nom explicite de l'action                                 | `formatDate.ts`, `withAvatarUrl.ts`           |
| Appels API    | regroupés dans `api.ts` par feature, une fonction par endpoint, verbe explicite | `getAnimalById`, `updateClinicInfo`           |

### Dossiers

- `kebab-case` ou nom de domaine au singulier pour les dossiers de feature : `features/animal/`, `features/clinic/` (pas `features/animals/`).
- Un dossier de feature reflète une entité/domaine métier, pas une page isolée — regrouper toutes les vues/composants liés à cette entité au même endroit.

### Composants — bonnes pratiques

- **Props** : `camelCase` dans le `<script setup>`, `kebab-case` à l'usage dans le template (`:date-of-birth="..."`).
- **Un composant = une responsabilité claire.** S'il dépasse ~150-200 lignes ou mélange plusieurs préoccupations, le découper.
- Préférer la composition (`composables/`) à la duplication de logique entre composants.
- Ne pas préfixer les composants par le nom du framework ou de la lib (`VueAnimalCard` ❌) — le multi-mot suffit à éviter les collisions.

---

## 🚀 Installation & scripts

```sh
pnpm install
```

| Commande         | Description                                     |
| ---------------- | ----------------------------------------------- |
| `pnpm dev`       | Démarre en mode watch avec hot-reload           |
| `pnpm build`     | Type-check + build de production                |
| `pnpm test:unit` | Tests unitaires ([Vitest](https://vitest.dev/)) |
| `pnpm lint`      | Lint ([ESLint](https://eslint.org/))            |

> Depuis la racine, privilégie `pnpm dev:web` (voir [README racine](../../README.md)).

---

## 🛠️ Setup recommandé

- **Éditeur** : [VS Code](https://code.visualstudio.com/) + extension [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) — désactiver Vetur si installé (conflit avec Volar).
- **Type-check des `.vue`** : TypeScript ne gère pas nativement les imports `.vue`, d'où l'usage de `vue-tsc` pour le check de types (à la place de `tsc`) et de Volar côté éditeur.
- **DevTools navigateur** : extension [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) (Chromium) ou [équivalent Firefox](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/), avec le _Custom Object Formatter_ activé dans les DevTools pour un affichage lisible des objets réactifs Vue.
- **Config build** : voir la [référence Vite](https://vite.dev/config/) pour personnaliser `vite.config.ts`.
