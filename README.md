# Stash

Application web de microapprentissage : un fil de memo cards courtes, chacune avec une idée actionnable inspirée des meilleurs livres de développement personnel (psychologie, communication, négociation, discipline, santé, leadership…). L'utilisateur parcourt, sauvegarde, révise en répétition espacée et relève un défi par jour.

- **Front / API** : Next.js 16 (App Router, TypeScript strict), Tailwind CSS 4
- **Données** : Supabase (PostgreSQL, Auth e-mail + Google, RLS, pgvector, Edge Function d'embeddings)
- **Contenu** : pipeline d'ingestion (Google Books, Open Library, Wikipedia, Wikiquote) et génération par l'API Anthropic (Claude), côté serveur uniquement
- **Déploiement** : Vercel (gratuit) + Supabase (gratuit), tâche quotidienne via Vercel Cron (ou pg_cron)

## Sommaire

1. [Architecture](#architecture)
2. [Installation locale](#installation-locale)
3. [Variables d'environnement](#variables-denvironnement)
4. [Créer le projet Supabase](#créer-le-projet-supabase)
5. [Contenu : seed et pipeline](#contenu--seed-et-pipeline)
6. [Tests](#tests)
7. [Déploiement sur Vercel](#déploiement-sur-vercel)
8. [Tâche planifiée quotidienne](#tâche-planifiée-quotidienne)
9. [Droits d'auteur et style](#droits-dauteur-et-style)

## Architecture

```
app/                    pages (App Router) et routes d'API
  api/                  routes validées avec Zod (feed, stash, review, challenge, profile, search, account, admin, cron)
  feed, stash, review, challenge, progress, search, profile, admin, onboarding, login
  books/[id], cards/[id], categories/[slug]   pages publiques
components/             composants UI (carte, navigation, thème, états vides/erreur)
lib/
  supabase/             clients navigateur, serveur (cookies) et service (admin), refresh de session (proxy)
  ai/                   prompts et appels Claude (génération, réécriture, notation)
  ingestion/            découverte, enrichissement, contrôles qualité/style, similarité, dédoublonnage, pipeline
  srs/sm2.ts            répétition espacée SM-2 (4 boutons)
  feed/mix.ts           mélange du fil (intérêts en round-robin + 20 % de découverte)
  i18n/                 dictionnaires fr / en
types/database.ts       types générés depuis Supabase
supabase/
  migrations/           schéma, index, RLS, vues et fonctions SQL
  functions/embed/      Edge Function d'embeddings (gte-small, 384 dimensions, gratuite)
  seed/                 catégories (12 principales, 67 sous-catégories, requêtes de découverte) et cartes de démo
  cron/                 alternative pg_cron à Vercel Cron
scripts/                seed, seed:categories, seed:demo, ingest
tests/unit|integration|e2e
```

Choix principaux (le plus simple à chaque fois) :

- **Rendu dynamique classique** (Cache Components désactivé) : presque toutes les pages sont personnelles, inutile de gérer un shell statique.
- **Le fil est calculé en deux temps** : la fonction SQL `feed_candidates` classe les cartes non vues (qualité, style, popularité, un peu d'aléatoire), puis `lib/feed/mix.ts` alterne les catégories et insère 20 % de cartes hors intérêts.
- **Embeddings gratuits** via l'Edge Function Supabase `embed` (modèle gte-small intégré), stockés dans `cards.embedding` (pgvector, index HNSW). La fonction `match_cards` rejette toute carte à plus de 0,92 de similarité cosinus.
- **Série (streak)** gérée par la fonction SQL `record_activity` avec la date locale du client ; les colonnes de série ne sont pas modifiables directement par l'utilisateur.
- **Défi du jour** déterministe par utilisateur et par jour (`daily_challenge`), la case « fait » est un `card_views.action = 'completed'`.

## Installation locale

Prérequis : Node.js 20.9+ et Docker (pour Supabase en local).

```bash
npm install
```

```bash
npx supabase start
```

La commande affiche l'URL de l'API, la clé publishable (anon) et la clé secrète (service role). Copiez `.env.example` vers `.env.local` et renseignez-les :

```bash
cp .env.example .env.local
```

Les migrations sont appliquées automatiquement par `supabase start`. Ensuite :

```bash
npm run seed:categories
```

```bash
npm run seed:demo
```

`seed:demo` insère 12 cartes écrites à la main (une par catégorie, en français et en anglais) pour tester l'app sans clé Anthropic. Puis :

```bash
npm run dev
```

L'app tourne sur http://localhost:3000. Les e-mails locaux (confirmation, etc.) arrivent dans Mailpit : http://127.0.0.1:54324. Pour accéder à `/admin`, mettez votre e-mail dans `ADMIN_EMAILS`.

Pour servir l'Edge Function d'embeddings en local avec son secret :

```bash
EMBEDDING_FUNCTION_SECRET=une-valeur-locale npx supabase start
```

(Le premier appel télécharge le modèle gte-small : la machine doit avoir accès à Internet.)

Après une modification du schéma, régénérez les types :

```bash
npm run db:types
```

## Variables d'environnement

Toutes sont documentées dans [`.env.example`](.env.example). Seules les variables `NEXT_PUBLIC_*` sont exposées au navigateur.

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Projet Supabase (clé publique, protégée par RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé secrète : routes serveur, cron, scripts. Jamais côté client |
| `NEXT_PUBLIC_SITE_URL` | URL publique (redirections d'auth, liens de partage) |
| `ADMIN_EMAILS` | E-mails autorisés sur `/admin` (séparés par des virgules) |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Génération de contenu (par défaut `claude-opus-5-5`) |
| `ANTHROPIC_FALLBACKS` | `default` active le repli automatique côté serveur si le modèle décline ; `off` pour un modèle qui ne le gère pas |
| `GOOGLE_BOOKS_API_KEY` | Optionnelle : quota plus élevé sur Google Books |
| `EMBEDDING_FUNCTION_SECRET`, `EMBEDDING_FUNCTION_URL` | Secret partagé avec l'Edge Function `embed` (URL déduite de Supabase par défaut) |
| `CRON_SECRET` | Protège `/api/cron/ingest` |
| `INGEST_MAX_MODEL_CALLS`, `INGEST_MAX_BOOKS_PER_RUN`, `INGEST_QUERIES_PER_RUN`, `INGEST_TIME_BUDGET_SECONDS` | Plafonds de l'exécution quotidienne (coût et durée) |
| `INGEST_PUBLISH_MODE` | `auto` publie les cartes qui passent tous les contrôles ; `review` les garde en brouillon pour validation dans `/admin` |
| `SEED_CARDS_PER_CATEGORY`, `SEED_BOOKS_PER_CATEGORY`, `SEED_MAX_MODEL_CALLS` | Objectifs et plafond du seed initial |

## Créer le projet Supabase

1. Créez un projet sur https://supabase.com (plan gratuit).
2. Liez le dépôt et poussez les migrations :

   ```bash
   npx supabase login
   ```

   ```bash
   npx supabase link --project-ref VOTRE_REF
   ```

   ```bash
   npx supabase db push
   ```

3. Déployez l'Edge Function d'embeddings et son secret :

   ```bash
   npx supabase functions deploy embed --no-verify-jwt
   ```

   ```bash
   npx supabase secrets set EMBEDDING_FUNCTION_SECRET=une-longue-valeur-aleatoire
   ```

4. **Auth** (Dashboard > Authentication) :
   - URL Configuration : `Site URL` = votre URL Vercel, et ajoutez `https://VOTRE-APP.vercel.app/auth/callback` aux Redirect URLs (et `http://localhost:3000/auth/callback` pour le local).
   - Providers > Google : créez un client OAuth dans Google Cloud Console (type « Web application »), avec comme URI de redirection autorisée `https://VOTRE_REF.supabase.co/auth/v1/callback`, puis collez l'ID et le secret dans Supabase.
5. Récupérez l'URL, la clé publishable et la clé secrète (Settings > API) pour vos variables d'environnement.

## Contenu : seed et pipeline

### Seed initial

```bash
npm run seed
```

Pour chaque catégorie principale, le script :

1. découvre les meilleurs livres (Google Books + Open Library) jusqu'à `SEED_BOOKS_PER_CATEGORY` livres (60 par défaut) ;
2. génère des cartes livre par livre, du plus populaire au moins populaire, jusqu'à `SEED_CARDS_PER_CATEGORY` cartes publiées (100 par défaut) **en français et en anglais**.

Tout l'état vit en base (`books.processed_at`, `cards`) : relancez la commande pour reprendre là où elle s'est arrêtée. Elle s'arrête proprement quand `SEED_MAX_MODEL_CALLS` est atteint. Options : `--category=<slug>` pour une seule catégorie, `--discover-only` pour ne faire que la découverte.

Ordre de grandeur : environ 3 appels au modèle par livre (génération, réécriture, notation) et 5 à 8 cartes publiées par livre et par langue, soit 15 à 25 livres et 45 à 75 appels par catégorie, à peu près 600 à 900 appels pour les 12 catégories. Le coût réel dépend du modèle choisi et du taux de rejet ; il est plafonné par `SEED_MAX_MODEL_CALLS`.

### Pipeline quotidien

`GET /api/cron/ingest` (avec `Authorization: Bearer $CRON_SECRET`) exécute :

1. **Découverte** : les requêtes les moins récemment utilisées (`ingestion_queries`) sont envoyées à Google Books et Open Library. Les résultats sont fusionnés, notés (score de popularité bayésien sur la note moyenne et le nombre d'avis) et filtrés (au moins 10 avis, note ≥ 3,6, livres déjà connus ignorés).
2. **Enrichissement** : description (Open Library si besoin), couverture, année ; statut « domaine public » vérifié via la date de décès de l'auteur sur Wikipedia (règle prudente : publié il y a plus de 95 ans **et** auteur mort depuis plus de 70 ans).
3. **Génération** : Claude produit 5 à 10 cartes par livre, en français et en anglais, dans une réponse JSON validée par Zod.
4. **Réécriture** : second passage « fais sonner ça comme une vraie personne, sans changer l'idée ».
5. **Notation** : qualité et style de 1 à 10 (seuil de publication : 7, stockés dans `quality_score` et `style_score`).
6. **Contrôles par règles** (`lib/ingestion/quality.ts`, `lib/ingestion/style.ts`) : longueurs, 2 à 4 phrases, action concrète, aucune suite de 15 mots identiques à la description du livre, citation de moins de 15 mots et attribuée, expressions et mots interdits, longueurs de phrases trop uniformes, plus de deux phrases commençant par le même mot, triplets d'adjectifs, tirets cadratins en série, ouverture qui reformule le titre, tutoiement, et structure identique à plus de 30 % des cartes récentes de la catégorie.
7. **Citations** : au plus une par livre, conservée seulement si elle est retrouvée mot pour mot sur Wikiquote.
8. **Dédoublonnage** : hash exact (`content_hash`) puis similarité cosinus pgvector (> 0,92 = rejet).
9. **Publication** : les cartes acceptées sont publiées (ou mises en brouillon en mode `review`) ; les cartes rejetées sont gardées avec leur motif pour l'audit. Tout est journalisé dans `ingestion_runs` (livres trouvés, cartes créées / rejetées, appels au modèle, erreurs).

Robustesse : limitation de débit par hôte, reprise sur erreur avec backoff exponentiel et jitter, délais d'expiration, plafond d'appels au modèle par exécution (`INGEST_MAX_MODEL_CALLS`), budget de temps (la fonction ne démarre plus de nouveau livre après `INGEST_TIME_BUDGET_SECONDS`), trois tentatives maximum par livre.

Exécution manuelle depuis le terminal :

```bash
npm run ingest -- --category=communication
```

### Page admin

`/admin` (réservée à `ADMIN_EMAILS`) : historique des exécutions et de leurs erreurs, nombre de cartes publiées par catégorie et par langue, **échantillon de 20 cartes au hasard de la dernière exécution** à approuver ou rejeter, file des brouillons, et bouton pour relancer l'ingestion d'une catégorie.

## Tests

| Commande | Contenu |
|---|---|
| `npm test` | Vitest : SM-2, mélange du fil, similarité et dédoublonnage, règles de qualité et de style, découverte, parseurs des sources, backoff et budget |
| `npm run test:db` | Intégration sur la base locale : RLS, fonctions SQL, pipeline complet avec modèle et API simulés (aucun coût) |
| `npm run test:e2e` | Playwright (mobile et desktop) : inscription, onboarding, fil, sauvegarde, note, révision, défi du jour |
| `npm run lint`, `npm run typecheck`, `npm run build` | Qualité et build |

Préparation pour `test:db` et `test:e2e` :

```bash
npx supabase start
```

```bash
npm run seed:demo
```

```bash
npm run build
```

Playwright démarre `npm run start` tout seul. Si les navigateurs Playwright ne sont pas installés, lancez `npx playwright install chromium`, ou pointez `PLAYWRIGHT_CHROMIUM_PATH` vers un Chromium existant.

## Déploiement sur Vercel

1. Importez le dépôt sur https://vercel.com (plan Hobby gratuit), framework Next.js détecté automatiquement.
2. Ajoutez les variables d'environnement de `.env.example` (Production et Preview) : URL et clés Supabase, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAILS`, `ANTHROPIC_API_KEY`, `EMBEDDING_FUNCTION_SECRET`, `CRON_SECRET` (chaîne aléatoire d'au moins 16 caractères), et les plafonds `INGEST_*`.
3. Déployez. Mettez à jour l'URL du site et les Redirect URLs dans Supabase Auth.
4. Lancez le seed une fois depuis votre machine, avec les variables du projet de production dans `.env.local` :

   ```bash
   npm run seed
   ```

Les images de couverture sont servies telles quelles (`images.unoptimized`), ce qui évite de consommer le quota d'optimisation d'images de Vercel.

## Tâche planifiée quotidienne

**Vercel Cron (par défaut)** : `vercel.json` déclare un appel quotidien à `/api/cron/ingest` à 04:17 UTC. Quand `CRON_SECRET` est défini dans Vercel, Vercel envoie automatiquement `Authorization: Bearer <CRON_SECRET>`. La route a `maxDuration = 300` (limite du plan Hobby) et le pipeline s'arrête de lui-même avant.

**pg_cron (alternative)** : exécutez [`supabase/cron/daily_ingest.sql`](supabase/cron/daily_ingest.sql) dans l'éditeur SQL de Supabase après avoir stocké l'URL et le secret dans Vault (instructions dans le fichier).

Chaque exécution apparaît dans `/admin` et dans la table `ingestion_runs`.

## Droits d'auteur et style

- Les cartes sont des idées **reformulées** : le prompt interdit de recopier le livre ou sa description, et le pipeline rejette toute carte qui partage 15 mots consécutifs avec la description source.
- Citation directe : au plus une par livre, moins de 15 mots, attribuée à l'auteur et au livre, et seulement si elle est retrouvée telle quelle sur Wikiquote.
- Chaque carte garde sa source (livre, auteur, lien Google Books ou Open Library, et un lien « Trouver en bibliothèque »).
- Pas de scraping de Google Search : la découverte passe par les API gratuites Google Books et Open Library.
- Le style visé (tutoiement, exemples concrets, phrases de longueurs variées, prise de position, pas de connecteurs mécaniques) est décrit dans `lib/ai/prompts.ts` et vérifié par `lib/ingestion/style.ts`.
- Santé et santé mentale : contenu informatif uniquement, le prompt interdit les conseils médicaux.
