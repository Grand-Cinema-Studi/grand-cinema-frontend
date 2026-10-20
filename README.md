# Grand Cinéma – Frontend

Application web de la plateforme de réservation en ligne du **Grand Cinéma** : un cinéma de 10 salles et 1 700 places qui veut proposer la consultation des séances et la réservation à distance, notamment pendant le Festival de Jazz.

Projet réalisé dans le cadre du Bachelor Développeur d'Application (Studi), Bloc 3 « Développer une solution digitale ».

| Ressource | Lien |
|---|---|
| Dépôt frontend (ce dépôt) | https://github.com/Grand-Cinema-Studi/grand-cinema-frontend |
| Dépôt backend (API) | https://github.com/Grand-Cinema-Studi/grand-cinema-backend |
| Dépôt de documentation (architecture, décisions techniques, règles communes, déploiement) | https://github.com/Grand-Cinema-Studi/grand-cinema-docs |
| Backlog (EPICs, user stories) | https://github.com/orgs/Grand-Cinema-Studi/projects/3 |

## Rôle du dépôt

Ce dépôt contient l'application web (SPA) utilisée par le public et par le personnel du cinéma :

- **Spectateurs et festivaliers** : consulter la programmation, créer un compte, réserver des places, payer et retrouver ses billets.
- **Personnel** (caisse, contrôle, programmation, direction) : écrans de gestion de la programmation et de suivi des réservations.

Le front ne contient aucune règle métier ni accès direct à la base de données : il communique uniquement avec l'[API backend](https://github.com/Grand-Cinema-Studi/grand-cinema-backend) par HTTP et JSON (routes `/api/...`). Les deux applications se développent, se testent et se déploient séparément. Le contrat entre les deux est décrit dans les [conventions d'API](https://github.com/Grand-Cinema-Studi/grand-cinema-docs/blob/main/api/api-conventions.md).

## Stack

| Domaine | Choix |
|---|---|
| Framework | Angular 22 (composants standalone, signals, sans zone.js), TypeScript 6 en mode strict |
| Styles | CSS et Tailwind CSS 4, thème repris de la maquette Figma (couleurs dans `src/styles.css`), sans bibliothèque de composants, mobile d'abord (maquettes mobile 390 px et desktop 1440 px) |
| Polices | Inter et Bebas Neue, auto-hébergées (`@fontsource`) : aucun appel à un service tiers |
| Appels à l'API | `HttpClient` (Fetch), chemins relatifs `/api/...` |
| Tests | Vitest (lancé par `ng test`), environnement jsdom, couverture V8 au format LCOV |
| Qualité | ESLint (`angular-eslint`), Prettier (avec `prettier-plugin-tailwindcss`), SonarCloud |
| Intégration continue | GitHub Actions, Dependabot |
| Hébergement | fichiers statiques sur S3, diffusés par CloudFront _(à venir)_, voir l'[ADR 0003](https://github.com/Grand-Cinema-Studi/grand-cinema-docs/blob/main/adr/0003-hosting-cloudfront-s3-ec2.md) |

## Appels à l'API : chemins relatifs, pas de CORS

Le front appelle toujours l'API par des chemins **relatifs** (`/api/schedule`), jamais par une adresse en dur, et aucun fichier d'environnement ne contient d'adresse d'API.

- **En local**, le serveur de développement d'Angular redirige `/api/...` vers l'API (`http://localhost:5073`), grâce à `proxy.conf.json`.
- **Sur la recette et en production**, CloudFront oriente `/api/*` vers l'API et le reste vers les fichiers du front sur S3.

Le navigateur ne voit donc qu'une seule adresse : aucune configuration CORS n'est nécessaire, ni côté front, ni côté API.

## Lancer le projet en local

### Prérequis

- Node.js 24 (LTS) : la version majeure est fixée par `.nvmrc` (`nvm use` la sélectionne) et par `engines` dans `package.json` ;
- npm (fourni avec Node) ;
- pour afficher des données : l'API du backend lancée en local (voir son [README](https://github.com/Grand-Cinema-Studi/grand-cinema-backend#lancer-le-projet-en-local)).

Le CLI Angular n'a pas besoin d'être installé globalement : il est fourni par le projet (`npx ng ...` ou les scripts npm).

### Démarrer

```bash
git clone https://github.com/Grand-Cinema-Studi/grand-cinema-frontend.git
cd grand-cinema-frontend
nvm use                 # optionnel, sélectionne la version de .nvmrc
npm ci                  # installe les dépendances exactes de package-lock.json
npm start               # http://localhost:4200
```

Avec l'API du backend lancée (`dotnet run --project src/GrandCinema.Api`, sur `http://localhost:5073`), le proxy est vérifiable :

```bash
curl http://localhost:4200/api/schedule   # programmation du jour, renvoyée par l'API à travers le serveur Angular
```

## Scripts npm

| Script | Rôle |
|---|---|
| `npm start` | serveur de développement sur http://localhost:4200, avec le proxy vers l'API |
| `npm run build` | compilation de production dans `dist/grand-cinema-frontend/browser` (fichiers à publier sur S3) |
| `npm test` | tests en continu (mode « watch ») |
| `npm run test:ci` | tests une seule fois, avec la couverture (`coverage/grand-cinema-frontend/lcov.info`, lue par SonarCloud) |
| `npm run lint` | analyse statique (ESLint) du TypeScript et des templates |
| `npm run format` | formate le code (Prettier, classes Tailwind triées) |
| `npm run format:check` | vérifie le formatage sans rien modifier (utilisé par la CI) |

## Arborescence

```text
src/
├── index.html              page hôte (lang="fr", titre, viewport)
├── main.ts                 démarrage de l'application
├── styles.css              Tailwind, polices et thème du cinéma (couleurs de la maquette)
└── app/
    ├── app.ts              composant racine, affiche la mise en page
    ├── app.config.ts       providers globaux : routeur, HttpClient
    ├── app.routes.ts       routes, chargées à la demande (loadComponent)
    ├── core/               éléments techniques communs
    │   ├── layout/         en-tête, zone des pages, pied de page (structure de la maquette)
    │   └── not-found/      page « introuvable » (toute adresse inconnue)
    ├── shared/             composants réutilisables (créé avec le premier)
    └── features/<feature>/ un dossier par fonctionnalité (créé avec la première story)
public/
├── favicon.ico
└── icons/                  icônes de la maquette (copiées telles quelles dans le build)
```

- Rangement **par fonctionnalité**, comme le backend : une user story ne touche, en principe, qu'un dossier de `features/`.
- Un dossier n'est créé que lorsqu'un fichier y arrive.
- Les tests sont à côté du fichier testé (`layout.spec.ts` à côté de `layout.ts`), nommés `when <situation>, then <résultat attendu>`, dans un `describe` qui porte le numéro de la story (`describe('US 1.1 – SchedulePage', ...)`).
- Tout le code est en anglais ; le français est réservé aux textes affichés à l'utilisateur.

## Intégration continue

À chaque Pull Request vers `dev` ou `main`, et à chaque push sur `dev`, le workflow `.github/workflows/ci.yml` (job `build-and-test`) lance : `npm ci`, lint, vérification du formatage, tests avec couverture, compilation de production, puis l'analyse SonarCloud. Le job échoue si le Quality Gate est rouge. Dependabot propose chaque semaine les mises à jour des dépendances npm et des actions GitHub, vers `dev`.

## État

Le squelette est en place (mise en page, page « introuvable », outillage, intégration continue). Les écrans sont développés en TDD, user story par user story. Les user stories et leur avancement sont suivis sur le [Project GitHub](https://github.com/orgs/Grand-Cinema-Studi/projects/3).

## Branches et contributions

| Branche | Rôle |
|---|---|
| `main` | production ; alimentée uniquement depuis `dev` ou une branche `hotfix/` |
| `dev` | intégration : c'est la branche `develop` du Git Flow, au nom abrégé |
| `feature/us-<n>-<intitulé>` | une user story (exemple : `feature/us-1-1-view-schedule`) |
| `fix/`, `chore/`, `docs/`, `test/`, `hotfix/` | correctifs, outillage, documentation, tests, correctifs urgents |

`main` et `dev` sont protégées : toute modification passe par une Pull Request. Les messages de commit suivent [Conventional Commits](https://www.conventionalcommits.org/fr/). Détail dans [CONTRIBUTING.md](CONTRIBUTING.md).

## Auteur

Slimane Smahi — Bachelor Développeur d'Application, Studi (2026).
