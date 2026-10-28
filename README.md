# Grand Cinéma – Frontend

Application web de la plateforme de réservation en ligne du **Grand Cinéma** : un cinéma de 10 salles et 1 700 places qui veut proposer la consultation des séances et la réservation à distance, notamment pendant le Festival de Jazz.

Projet réalisé dans le cadre du Bachelor Développeur d'Application (Studi), Bloc 3 « Développer une solution digitale ».

| Ressource | Lien |
|---|---|
| Dépôt frontend (ce dépôt) | https://github.com/Grand-Cinema-Studi/grand-cinema-frontend |
| Dépôt backend (API) | https://github.com/Grand-Cinema-Studi/grand-cinema-backend |
| Dépôt de documentation (architecture, décisions techniques, règles communes, déploiement) | https://github.com/Grand-Cinema-Studi/grand-cinema-docs |
| Backlog (EPICs, user stories) | https://github.com/orgs/Grand-Cinema-Studi/projects/3 |
| Qualité du code (SonarCloud) | https://sonarcloud.io/project/overview?id=Grand-Cinema-Studi_grand-cinema-frontend |

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
| Appels à l'API | `HttpClient` (Fetch), chemins relatifs `/api/...`, jeton ajouté par un intercepteur fonctionnel |
| Formulaires | Reactive Forms typés (`NonNullableFormBuilder`), mêmes limites que l'API pour aider l'utilisateur ; l'API reste seule juge |
| Session | jeton JWT et utilisateur en `sessionStorage`, exposés par des signals (`AuthService`) ; garde de route sur les pages réservées aux utilisateurs connectés |
| Tests | Vitest (lancé par `ng test`), environnement jsdom, couverture V8 au format LCOV |
| Qualité | ESLint (`angular-eslint`), Prettier (avec `prettier-plugin-tailwindcss`), SonarCloud (Quality Gate bloquant) |
| Intégration et déploiement continus | GitHub Actions, Dependabot ; accès à AWS par OIDC, sans clé stockée |
| Hébergement | fichiers statiques dans un bucket S3 privé, diffusés par CloudFront (accès au bucket réservé à CloudFront), voir l'[ADR 0003](https://github.com/Grand-Cinema-Studi/grand-cinema-docs/blob/main/adr/0003-hosting-cloudfront-s3-ec2.md) |

## Appels à l'API : chemins relatifs, pas de CORS

Le front appelle toujours l'API par des chemins **relatifs** (`/api/schedule`), jamais par une adresse en dur, et aucun fichier d'environnement ne contient d'adresse d'API.

- **En local**, le serveur de développement d'Angular redirige `/api/...` vers l'API (`http://localhost:5073`), grâce à `proxy.conf.json`.
- **Sur la recette et en production**, CloudFront oriente `/api/*` vers l'API et le reste vers les fichiers du front sur S3.

Le navigateur ne voit donc qu'une seule adresse : aucune configuration CORS n'est nécessaire, ni côté front, ni côté API.

Une adresse de l'application comme `/schedule` ou `/account` n'est pas un fichier de S3 : une CloudFront Function (`spa-routing`), attachée au seul comportement du front, sert `index.html` pour toute adresse sans extension, et le routeur Angular affiche l'écran. Les « réponses d'erreur personnalisées » de CloudFront ne sont pas utilisées : elles changeraient aussi les `403` et `404` de l'API en page HTML.

## Comptes et session

- **Session** : l'inscription (`POST /api/users`) et la connexion (`POST /api/tokens`) renvoient un jeton JWT et l'utilisateur. `AuthService` les garde en `sessionStorage` : la session survit au rechargement de l'onglet et disparaît à sa fermeture ; un jeton expiré est ignoré au démarrage.
- **Intercepteur** (`authInterceptor`) : ajoute `Authorization: Bearer <jeton>` aux seuls appels `/api/...` ; une réponse `401` efface la session.
- **Garde** (`authGuard`) : `/account` sans être connecté ouvre la page de connexion (`/sign-in?returnUrl=%2Faccount`), qui ramène ensuite à la page demandée. L'adresse de retour n'est suivie que si c'est une page du site (pas de redirection ouverte).
- **Messages d'erreur** : `problemMessage()` choisit un message en français d'après le `type` des réponses Problem Details de l'API (`/errors/email-already-used`, `/errors/invalid-credentials`…) ; `429` donne « Trop de tentatives », toute autre erreur « Le service est momentanément indisponible ». Le `title` de l'API, en anglais, n'est jamais affiché.
- **RGPD** : l'inscription exige l'acceptation de la politique de confidentialité (case obligatoire, lien vers `/privacy-policy`) ; l'API la vérifie aussi et enregistre la version acceptée. « Mon compte » permet de supprimer son compte (`DELETE /api/users/me`), après une confirmation explicite.

## Lancer le projet en local

### Prérequis

- Node.js 24 (LTS) : la version majeure est fixée par `.nvmrc` (`nvm use` la sélectionne) et par `engines` dans `package.json` ;
- npm (fourni avec Node) ;
- pour afficher des données : l'API du backend lancée en local (voir son [README](https://github.com/Grand-Cinema-Studi/grand-cinema-backend#lancer-le-projet-en-local)), avec une base locale à jour. Après avoir récupéré de nouvelles migrations du backend, les appliquer (`dotnet ef database update --project src/GrandCinema.Infrastructure --startup-project src/GrandCinema.Api`, dans le dépôt du backend) : sinon l'API répond `500` et le front affiche « Le service est momentanément indisponible ».

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
    ├── app.config.ts       providers globaux : routeur, HttpClient avec l'intercepteur, affichage en français
    ├── app.routes.ts       routes, chargées à la demande (loadComponent) ; /account protégée par authGuard
    ├── core/               éléments techniques communs
    │   ├── auth/           session (AuthService), intercepteur, garde, types des échanges avec l'API
    │   ├── errors/         messages en français d'après les réponses Problem Details de l'API
    │   ├── layout/         en-tête (Connexion, ou prénom une fois connecté), zone des pages, pied de page
    │   └── not-found/      page « introuvable » (toute adresse inconnue)
    ├── shared/             réutilisé par plusieurs écrans
    │   ├── movie-card/     carte d'un film (affiche, titre, genre, durée)
    │   ├── paginator/      pagination des listes (6 films par page)
    │   └── runtime.pipe.ts durée d'un film (« 2h 06m »)
    └── features/           un dossier par fonctionnalité
        ├── schedule/       US 1.1 : accueil (/) : films à la une, recherche de séance, programmation d'un jour
        ├── cinema/         présentation des salles (section statique de l'accueil)
        ├── movies/         US 1.1 : films à l'affiche (/movies)
        ├── auth/           US 2.1 : créer un compte (/sign-up), se connecter (/sign-in)
        ├── account/        US 2.1 : mon compte (/account) : profil, déconnexion, suppression du compte
        └── legal/          US 2.1 : politique de confidentialité (/privacy-policy)
public/
├── favicon.ico
├── icons/                  icônes de la maquette (copiées telles quelles dans le build)
└── images/                 photos de la maquette (salle de cinéma)
```

- Rangement **par fonctionnalité**, comme le backend : une user story ne touche, en principe, qu'un dossier de `features/`.
- Un dossier n'est créé que lorsqu'un fichier y arrive.
- Les tests sont à côté du fichier testé (`layout.spec.ts` à côté de `layout.ts`), nommés `when <situation>, then <résultat attendu>`, dans un `describe` qui porte le numéro de la story (`describe('US 1.1 – SchedulePage', ...)`).
- Tout le code est en anglais ; le français est réservé aux textes affichés à l'utilisateur.

## Intégration et déploiement continus

| Workflow | Déclencheur | Ce qu'il fait |
|---|---|---|
| `ci.yml` (job `build-and-test`) | chaque Pull Request vers `dev` ou `main`, chaque push sur `dev` | `npm ci`, lint, vérification du formatage, tests avec couverture, compilation de production, puis analyse SonarCloud ; le job échoue si le Quality Gate est rouge |
| `deploy.yml` | chaque push sur `dev` (donc chaque fusion), ou à la main | dans l'environnement GitHub `recette` : tests, compilation, publication sur S3 (`aws s3 sync`), invalidation du cache CloudFront, puis vérification de `/` et de `/schedule` à travers CloudFront |
| `main-source-branch.yml` | chaque Pull Request vers `main` | refuse toute branche source autre que `dev` ou `hotfix/*` |

- `build-and-test` et « SonarCloud Code Analysis » sont des contrôles obligatoires du ruleset `protect-main-and-dev` : une Pull Request rouge ne peut pas être fusionnée.
- **Recette déployée à chaque fusion dans `dev`.** Le workflow obtient des identifiants AWS temporaires par OIDC : aucune clé n'est stockée dans GitHub, et le rôle ne peut qu'écrire dans le bucket du front et invalider sa distribution.
- **Cache** : les fichiers à empreinte (`main-XXXX.js`, `styles-XXXX.css`) sont gardés un an ; `index.html` et les fichiers de `public/` sont revalidés à chaque visite, pour que la nouvelle version soit servie dès la livraison.
- Dependabot propose chaque semaine les mises à jour des dépendances npm et des actions GitHub, vers `dev`.
- La mise en production reste manuelle, après validation du Product Owner (environnement GitHub `production`, à créer avec la préproduction et la production).

## État

| User story | Écran | API | État |
|---|---|---|---|
| US 1.1 | Accueil (`/`) : carrousel des films à la une (4 premiers films du jour), barre « Votre prochaine évasion » (date, film), programmation d'un jour : films et séances (heure, salle), choix du jour parmi les 7 prochains, filtre par genre, 6 films par page | `GET /api/schedule?date=` | ✅ |
| US 1.1 | Tous les films à l'affiche (`/movies`), 6 films par page | `GET /api/movies` | ✅ |
| US 2.1 | Créer un compte (`/sign-up`) : prénom, nom, adresse e-mail, mot de passe de 12 caractères au moins, acceptation obligatoire de la politique de confidentialité | `POST /api/users` | ✅ |
| US 2.1 | Se connecter (`/sign-in`), puis retour à la page demandée | `POST /api/tokens` | ✅ |
| US 2.1 | Mon compte (`/account`, réservé aux utilisateurs connectés) : profil, déconnexion, suppression du compte après confirmation | `GET /api/users/me`, `DELETE /api/users/me` | ✅ |
| US 2.1 | Politique de confidentialité (`/privacy-policy`), liée depuis l'inscription et le pied de page | — | ✅ |
| US 2.1 | En-tête : « Connexion », ou prénom de l'utilisateur une fois connecté | — | ✅ |

Les écrans sont développés en TDD, user story par user story. Les user stories et leur avancement sont suivis sur le [Project GitHub](https://github.com/orgs/Grand-Cinema-Studi/projects/3).

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
