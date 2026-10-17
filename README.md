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
| Framework | Angular _(à venir)_ |

## État

Le dépôt est en cours d'initialisation : le projet Angular n'est pas encore créé. Les user stories et leur avancement sont suivis sur le [Project GitHub](https://github.com/orgs/Grand-Cinema-Studi/projects/3).
