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
| QR codes | bibliothèque `qrcode` (MIT) : le code du billet est encodé dans le navigateur, puis dessiné en SVG par un gabarit Angular (aucune image stockée, aucun HTML injecté) ; dépendance CommonJS déclarée dans `allowedCommonJsDependencies`, chargée avec la seule page d'une réservation |
| Lecture des QR codes | bibliothèque `jsqr` (Apache 2.0) : chaque image de la caméra du contrôleur est lue dans le navigateur (`QrFrameReader`), seul le texte lu part vers l'API ; elle fonctionne aussi sur iPhone et dans Firefox, où l'API `BarcodeDetector` du navigateur n'existe pas ; CommonJS, déclarée comme `qrcode` |
| Formulaires | Reactive Forms typés (`NonNullableFormBuilder`), mêmes limites que l'API pour aider l'utilisateur ; l'API reste seule juge |
| Session | jeton JWT et utilisateur en `sessionStorage`, exposés par des signals (`AuthService`) ; garde de route sur les pages réservées aux utilisateurs connectés |
| Tests | Vitest (lancé par `ng test`), environnement jsdom, couverture V8 au format LCOV |
| Qualité | ESLint (`angular-eslint`), Prettier (avec `prettier-plugin-tailwindcss`), SonarCloud (Quality Gate bloquant) |
| Intégration et déploiement continus | GitHub Actions, Dependabot ; accès à AWS par OIDC, sans clé stockée |
| Hébergement | fichiers statiques dans un bucket S3 privé, diffusés par CloudFront (accès au bucket réservé à CloudFront), voir l'[ADR 0003](https://github.com/Grand-Cinema-Studi/grand-cinema-docs/blob/main/adr/0003-hosting-cloudfront-s3-ec2.md) |

## Maquettes

Les écrans publics ont été maquettés dans Figma **avant** le développement, à partir des fonctionnalités du MVP (Bloc 1) : [maquettes Figma](https://www.figma.com/design/STWs0Pj1CyWqE5uiwkUaf6/Grand-Cinema-Studi?node-id=0-1&t=JxUrvrVWBIhG6gBz-1) (lecture seule, sans compte).

| Maquetté (ordinateur et téléphone) | Repris dans le front |
|---|---|
| En-tête et pied de page, communs à toutes les pages | `core/layout/` |
| Page d'accueil | `features/schedule/` (programmation, films à la une, recherche d'une séance), `features/cinema/` |
| Politique de confidentialité | `features/legal/privacy-policy-page/` |
| Page Contact | non développée : hors du MVP |

- **Charte** : les couleurs et les polices de la maquette sont les variables du thème Tailwind, dans `src/styles.css` (`--color-night`, `--color-brand`, `--color-cream`… ; Bebas Neue pour les titres, Inter pour le texte). Chaque variable devient une classe (`bg-night`, `text-cream`, `font-display`) : tous les écrans partagent la même charte.
- **Écrans sans maquette**, conçus pendant le développement avec ce thème et les mêmes composants : tous les films, fiche d'un film, réservation, paiement, billet, connexion, inscription, mon compte, conditions générales de vente, mentions légales, bandeau des cookies, et les écrans du personnel (programmation, suivi des réservations, contrôle des billets).

## Appels à l'API : chemins relatifs, pas de CORS

Le front appelle toujours l'API par des chemins **relatifs** (`/api/schedule`), jamais par une adresse en dur, et aucun fichier d'environnement ne contient d'adresse d'API.

- **En local**, le serveur de développement d'Angular redirige `/api/...` vers l'API (`http://localhost:5073`), grâce à `proxy.conf.json`. Il redirige aussi `/posters/...` (US 5.6) : les affiches des films ajoutés par le responsable sont servies, en local, par l'API depuis son dossier `posters-dev/`.
- **Sur la recette et en production**, CloudFront oriente `/api/*` vers l'API, `/posters/*` vers le bucket S3 privé des affiches, et le reste vers les fichiers du front sur S3.

Le navigateur ne voit donc qu'une seule adresse : aucune configuration CORS n'est nécessaire, ni côté front, ni côté API.

Une adresse de l'application comme `/schedule` ou `/account` n'est pas un fichier de S3 : une CloudFront Function (`spa-routing`), attachée au seul comportement du front, sert `index.html` pour toute adresse sans extension, et le routeur Angular affiche l'écran. Les « réponses d'erreur personnalisées » de CloudFront ne sont pas utilisées : elles changeraient aussi les `403` et `404` de l'API en page HTML.

## Comptes et session

- **Session** : l'inscription (`POST /api/users`) et la connexion (`POST /api/tokens`) renvoient un jeton JWT et l'utilisateur. `AuthService` les garde en `sessionStorage` : la session survit au rechargement de l'onglet et disparaît à sa fermeture ; un jeton expiré est ignoré au démarrage.
- **Intercepteur** (`authInterceptor`) : ajoute `Authorization: Bearer <jeton>` aux seuls appels `/api/...` ; une réponse `401` efface la session.
- **Garde** (`authGuard`) : `/account` sans être connecté ouvre la page de connexion (`/sign-in?returnUrl=%2Faccount`), qui ramène ensuite à la page demandée. L'adresse de retour n'est suivie que si c'est une page du site (pas de redirection ouverte).
- **Garde de rôle** (`roleGuard(...rôles)`) : un écran du personnel ne s'ouvre qu'aux rôles listés (`/programming` : le responsable ; `/tracking` : le responsable et le caissier ; `/ticket-check` : le contrôleur) ; un autre rôle revient à l'accueil (d'où le caissier et le contrôleur repartent vers leur page, voir ci-dessous), un visiteur non connecté passe par la connexion. C'est un confort : l'API répond `403` aux autres rôles de toute façon.
- **À chaque rôle ses pages** (décision du Product Owner, 07/11/2026) : deux règles écrites une fois, dans `core/auth/roles.ts`. `staffHome(role)` : le caissier travaille sur `/tracking`, le contrôleur sur `/ticket-check` ; la garde `staffHomeGuard`, posée sur l'accueil, « Tous les films » et la fiche d'un film, les y renvoie (« Mon compte » et les pages légales restent ouvertes à tous). `canBuyTickets(user)` : seuls un visiteur et un spectateur se voient proposer un achat ; « Acheter un billet » disparaît de l'en-tête du personnel, et la fiche d'un film montre au responsable « La réservation en ligne est réservée aux spectateurs. » au lieu du formulaire. L'API refuse de toute façon l'achat au personnel (`403`).
- **Messages d'erreur** : `problemMessage()` choisit un message en français d'après le `type` des réponses Problem Details de l'API (`/errors/email-already-used`, `/errors/invalid-credentials`…) ; `429` donne « Trop de tentatives », toute autre erreur « Le service est momentanément indisponible ». Le `title` de l'API, en anglais, n'est jamais affiché.
- **RGPD** : l'inscription exige l'acceptation de la politique de confidentialité (case obligatoire, lien vers `/privacy-policy`) ; l'API la vérifie aussi et enregistre la version acceptée. « Mon compte » permet de supprimer son compte (`DELETE /api/users/me`), après une confirmation explicite.
- **Cookies** : aucun cookie de mesure d'audience ni de publicité. Le bandeau de la première visite recueille le choix du visiteur (`CookieConsentService`), gardé 6 mois dans `localStorage` (clé `grand-cinema.cookie-consent`) : un outil ajouté plus tard ne se chargera que si le choix est « accepté ». Le jeton de connexion, lui, reste en `sessionStorage`.

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

Pour essayer le paiement (US 3.1) : l'API a besoin de ses clés Stripe de test, et la [Stripe CLI](https://docs.stripe.com/stripe-cli) relaie à l'API locale les notifications de Stripe (voir le README du backend). Dans un autre terminal :

```bash
stripe listen --events checkout.session.completed --forward-to http://localhost:5073/api/payments/stripe-webhook
```

Cartes de test sur la page de Stripe : `4242 4242 4242 4242` (paiement accepté), `4000 0000 0000 0002` (carte refusée), avec une date future et un code quelconque.

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
    ├── app.config.ts       providers globaux : routeur (paramètres d'adresse passés aux pages en entrées), HttpClient avec l'intercepteur, affichage en français
    ├── app.routes.ts       routes, chargées à la demande (loadComponent) ; /account et /reservations/:id protégées par authGuard, '', /movies et /movies/:movieId par staffHomeGuard (le caissier et le contrôleur vont à leur page), /programming par roleGuard('Manager'), /tracking par roleGuard('Manager', 'Cashier'), /ticket-check par roleGuard('TicketInspector')
    ├── core/               éléments techniques communs
    │   ├── auth/           session (AuthService), intercepteur, gardes (connexion ; rôle, pour les écrans du personnel ; page du personnel, pour les pages publiques), règles des rôles (roles.ts : qui achète, quelle page pour quel rôle), types des échanges avec l'API
    │   ├── consent/        US 1.2 : choix du visiteur sur les cookies non essentiels (gardé 6 mois), bandeau de la première visite
    │   ├── errors/         messages en français d'après les réponses Problem Details de l'API
    │   ├── layout/         en-tête (Connexion, ou prénom une fois connecté ; « Programmation » pour le responsable, « Réservations » pour le responsable et le caissier ; « Contrôle » pour le contrôleur ; « Acheter un billet » seulement pour un visiteur ou un spectateur ; menu sur téléphone), zone des pages, pied de page (mentions légales ; « Cookies » rouvre le bandeau)
    │   ├── navigation/     sortie vers un autre site (page de paiement Stripe), remplacée par une doublure dans les tests
    │   └── not-found/      page « introuvable » (toute adresse inconnue)
    ├── shared/             réutilisé par plusieurs écrans
    │   ├── movie-card/     carte d'un film (affiche, titre, genre, durée), lien vers sa fiche
    │   ├── paginator/      pagination des listes (6 films par page)
    │   └── runtime.pipe.ts durée d'un film (« 2h 06m »)
    └── features/           un dossier par fonctionnalité
        ├── schedule/       US 1.1 et 2.2 : accueil (/) : films à la une, recherche de séance, programmation d'un jour (« Autre date » jusqu'à un an), pastille de séance avec les places restantes, lien vers la réservation (partagée avec la fiche d'un film)
        ├── cinema/         présentation des salles (section statique de l'accueil)
        ├── movies/         US 1.1 : films à l'affiche (/movies), fiche d'un film et ses séances (/movies/:id)
        ├── reservations/   US 2.3, 3.1 et 3.2 : formulaire de réservation (fiche d'un film), page du blocage (/reservations/:id) : compte à rebours, « Annuler », conditions générales de vente et « Payer », paiement confirmé, puis le billet ; ticket-qr-code/ : QR code du billet en SVG
        ├── programming/    US 5.2 et 5.6 : programmation pour le responsable (/programming) : ajouter, déplacer, annuler des séances ; ajouter, modifier et archiver un film du catalogue, avec son affiche
        ├── ticket-check/   US 4.1 : contrôle des billets (/ticket-check), pour le contrôleur : choix de la séance, caméra (ticket-scanner/, lecture par QrFrameReader) ou saisie du code, verdict vert ou rouge
        ├── tracking/       US 5.3 et 5.1 : suivi des réservations (/tracking), pour le responsable et le caissier : par séance, places vendues, bloquées, restantes et taux de remplissage
        ├── auth/           US 2.1 : créer un compte (/sign-up), se connecter (/sign-in)
        ├── account/        US 2.1 et 3.2 : mon compte (/account) : profil, mes billets, déconnexion, suppression du compte
        └── legal/          US 2.1, 3.1 et 1.2 : politique de confidentialité (/privacy-policy), conditions générales de vente (/terms-of-sale), mentions légales (/legal-notice)
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
| US 1.1 | Accueil (`/`) : carrousel des films à la une (4 films, ceux dont la prochaine séance est la plus proche, à toute heure), barre « Votre prochaine évasion » (date, film), programmation d'un jour : films et séances pas encore commencées (heure, salle), « Plus aucune séance aujourd'hui » le soir venu, choix du jour parmi les 7 prochains, filtre par genre, 6 films par page | `GET /api/schedule?date=`, `GET /api/movies/featured` | ✅ |
| US 1.1 | Tous les films à l'affiche (`/movies`), 6 films par page | `GET /api/movies` | ✅ |
| US 1.1 | Fiche d'un film (`/movies/:id`), ouverte depuis une carte de film ou « Réserver » du carrousel : informations du film et toutes ses séances à venir, jour par jour (7 jours, puis « Voir les dates suivantes »), avec les places restantes, ou « Aucune séance à venir pour ce film » et un lien vers les films à l'affiche ; « Film introuvable » pour un film inconnu | `GET /api/movies/{id}` | ✅ |
| US 1.1 | Accueil : champ « Autre date », d'aujourd'hui à un an plus tard (réservation longtemps à l'avance) | `GET /api/schedule?date=` | ✅ |
| US 1.2 | Bandeau des cookies à la première visite : « Tout refuser » et « Tout accepter », de même style ; la page reste lisible et utilisable dessous, refuser n'empêche ni de consulter ni de réserver ; choix gardé 6 mois, « Cookies » en pied de page le rouvre | — | ✅ |
| US 1.2 | Mentions légales (`/legal-notice`), liées depuis le pied de page : éditeur, directeur de la publication, hébergeur (AWS, région de Paris), paiement (Stripe), conception, propriété intellectuelle ; texte de démonstration, à valider par la direction | — | ✅ |
| US 2.1 | Créer un compte (`/sign-up`) : prénom, nom, adresse e-mail, mot de passe de 12 caractères au moins, acceptation obligatoire de la politique de confidentialité | `POST /api/users` | ✅ |
| US 2.1 | Se connecter (`/sign-in`), puis retour à la page demandée | `POST /api/tokens` | ✅ |
| US 2.1 | Mon compte (`/account`, réservé aux utilisateurs connectés) : profil, déconnexion, suppression du compte après confirmation | `GET /api/users/me`, `DELETE /api/users/me` | ✅ |
| US 2.1 | Politique de confidentialité (`/privacy-policy`), liée depuis l'inscription et le pied de page | — | ✅ |
| US 2.1 | En-tête : « Connexion », ou prénom de l'utilisateur une fois connecté ; sur téléphone, ces liens passent dans un menu (bouton à trois traits) | — | ✅ |
| US 2.2 | Accueil : places restantes de chaque séance (« 42 places », « 1 place »), « Complet » quand il n'en reste aucune | `GET /api/schedule` (`remainingSeats`) | ✅ |
| US 2.3 | Réserver depuis une séance : formulaire sur la fiche du film (1 à 10 places, toujours visible en faisant défiler), connexion ou création de compte puis retour au formulaire ; page du blocage (`/reservations/:id`) avec places, montant et compte à rebours de 10 minutes, bouton « Annuler » qui libère aussitôt les places et ramène à la fiche du film, puis message quand les places sont libérées ; messages pour « plus assez de places », « séance commencée » et la limite de 10 places par compte et par séance | `POST /api/reservations`, `GET /api/reservations/{id}`, `DELETE /api/reservations/{id}` | ✅ |
| US 3.1 | Payer depuis la page du blocage : case « J'accepte les conditions générales de vente » obligatoire (lien vers `/terms-of-sale`, ouvert dans un nouvel onglet), « Payer » ouvre la page de paiement Stripe, où la carte est saisie ; au retour, « Paiement en cours de confirmation » le temps que Stripe notifie l'API, puis « Paiement confirmé » avec places et montant ; messages pour un blocage expiré et une réservation déjà payée | `POST /api/reservations/{id}/payment`, `GET /api/reservations/{id}` | ✅ |
| US 3.2 | Le billet, sur la page d'une réservation payée : film, date et heure, salle, places, et le QR code du code du billet, à présenter en salle ; pour une séance annulée, « Séance annulée » et pas de QR code | `GET /api/reservations/{id}/ticket` | ✅ |
| US 3.2 | « Mes billets », dans « Mon compte » : les réservations payées, la séance la plus tardive d'abord, chacune avec « Voir le billet » | `GET /api/users/me/tickets` | ✅ |
| US 4.1 | Contrôle des billets (`/ticket-check`, lien « Contrôle » pour le contrôleur) : choix de la séance du jour, lecture du QR code par la caméra arrière du téléphone (un même code lu une fois, puis ignoré 3 secondes) ou saisie du code ; aussitôt, bandeau vert « Accès autorisé » (film, places) ou rouge « Accès refusé » (déjà utilisé, autre séance, code inconnu ou illisible) | `GET /api/ticket-checks/screenings`, `POST /api/ticket-checks` | ✅ |
| US 3.1 | Conditions générales de vente (`/terms-of-sale`), liées depuis la page du blocage et le pied de page | — | ✅ |
| US 5.1 | Suivi au guichet : le caissier ouvre le suivi des réservations (`/tracking`, lien « Réservations » dans l'en-tête et le menu du téléphone), en lecture seule : par séance, places vendues en ligne et restantes ; ni lien « Programmation » ni accès à `/programming` ; l'accueil et les films le ramènent au suivi (07/11/2026) | `GET /api/reservation-tracking?date=` | ✅ |
| US 5.2 | Programmation (`/programming`, réservée au responsable, lien « Programmation » dans l'en-tête) : séances d'un jour avec places prises sur la capacité, « Commencée » ou « Terminée » ; ajout d'une séance (film, salle, heure, prix) dans un formulaire qui reste visible à droite ; modification de l'heure et du prix, annulation ; avertissement avec « Confirmer » quand des places sont bloquées ou vendues ; messages sous la séance ou sous le formulaire concerné | `GET /api/programming`, `POST /api/programming/screenings`, `PUT` et `DELETE /api/programming/screenings/{id}` | ✅ |
| US 5.6 | Le catalogue des films, dans la page Programmation : « Ajouter un film au catalogue » ouvre un formulaire (titre, synopsis, durée, date de sortie, genre choisi dans la liste donnée par l'API, fichier de l'affiche en JPEG, PNG ou WebP) ; une affiche de plus de 2 Mo est refusée dès son choix, sans appel ; une fois le film ajouté, il est déjà choisi dans « Nouvelle séance ». « Modifier un film du catalogue » (liste déroulante) ouvre le même formulaire, rempli avec la fiche et la vignette de l'affiche actuelle ; une nouvelle affiche est facultative. « Archiver ce film », puis « Confirmer l'archivage » ou « Ne pas archiver » : le film archivé n'est plus proposé à la programmation, ses séances et ses ventes passées restent (aucune suppression). Messages en français pour un film déjà au catalogue, un film archivé, et une durée changée ou un archivage alors qu'une séance du film n'est pas terminée | `GET /api/programming` (`genres`, `movies`), `POST /api/programming/movies` et `PUT /api/programming/movies/{id}` (`multipart/form-data`), `POST /api/programming/movies/{id}/archive` | ✅ |
| US 5.3 | Suivi des réservations (`/tracking`, réservé au responsable et au caissier, lien « Réservations » dans l'en-tête et le menu du téléphone) : pour chaque séance d'un jour, places vendues (en ligne, au guichet), bloquées, restantes, capacité et taux de remplissage avec une barre ; total de la journée en tête | `GET /api/reservation-tracking?date=` | ✅ |
| Droits par rôle | Chaque rôle n'ouvre que ses pages : le caissier et le contrôleur sont renvoyés de l'accueil et des films vers leur page ; achat proposé seulement à un visiteur ou un spectateur (en-tête, fiche d'un film), le responsable garde l'accueil sans acheter (décision du Product Owner, 07/11/2026) | `POST /api/reservations` (`403` pour le personnel) | ✅ |

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
