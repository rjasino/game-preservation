# Game Ako Chronicles

A game preservation retrospective — chronicling the games that shaped us.
Tracking risk levels, platform availability, and the fight to keep our digital
history playable.

## Getting Started

### Prerequisites

| Requirement | Version | How to verify |
|-------------|---------|---------------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| MongoDB | 7+ | `mongosh --eval "db.version()"` |

### Web App

The main application is a Next.js site under `apps/game-ako/`.

```bash
cd apps/game-ako
```

#### Setup

```bash
# Install dependencies
npm install

# Create environment config (edit with your values)
cp .env.local.example .env.local   # or create .env.local from scratch
```

Required environment variables in `.env.local`:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `AUTH_SECRET` | Auth.js secret (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `ADMIN_EMAIL` | Pre-seeded admin email |
| `ADMIN_PASSWORD` | Pre-seeded admin password |
| `AUTH_URL` | Application URL (default: `http://localhost:3000`) |

#### Seed the Admin Account

```bash
npm run seed
```

Creates the admin user if it doesn't already exist. Idempotent — safe to run
on every deploy.

#### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint on all source files |
| `npm test` | Run all tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run seed` | Seed the admin account |
| `npm run healthcheck` | Validate toolchain is operational |

#### Verification

After seeding, open `http://localhost:3000` and:

1. Visit `/register` to create an author account
2. Visit `/login` to sign in (email/password or Google)
3. Visit `/admin` as the seeded admin to access the review queue

---

## Data Ingestion (Python)

The IGDB fetcher under `.asd/artifacts/` pulls PS Vita game metadata from the
[IGDB API](https://api-docs.igdb.com/).

### Prerequisites

| Requirement | How to get it |
|-------------|---------------|
| Python 3.7+ | [python.org](https://www.python.org/) |
| `requests` | `pip install requests` |
| `python-dotenv` (optional) | `pip install python-dotenv` |

### IGDB Credentials

Register a Twitch app at
[dev.twitch.tv](https://dev.twitch.tv/docs/authentication/register-app/)
to get a **Client-ID** and **Client Secret**. Set them as environment variables
or pass via CLI flags.

### Usage

```bash
# Auto-generate token from Client Secret
python .asd/artifacts/fetch_ps_vita_games.py \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_CLIENT_SECRET

# Japan-only games
python .asd/artifacts/fetch_ps_vita_games.py \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_CLIENT_SECRET \
  --japan-only

# Custom output path and timeout
python .asd/artifacts/fetch_ps_vita_games.py \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_CLIENT_SECRET \
  --output vita_games.json \
  --timeout 60
```

### Flags

| Flag | Description | Env Var |
|------|-------------|---------|
| `--client-id` | Twitch Client-ID **(required)** | `IGDB_CLIENT_ID` |
| `--client-secret` | Twitch Client Secret | `IGDB_CLIENT_SECRET` |
| `--token` | Pre-existing Bearer Token | `IGDB_TOKEN` |
| `--japan-only` | Japan-exclusive games | — |
| `--output` | Output JSON path | — |
| `--timeout` | HTTP timeout in seconds (default: 30) | — |

The script auto-delays between pages to respect IGDB's ~4 req/s rate limit and
retries on HTTP 429. Output is a JSON file with a `metadata` block and a
`games` array containing ratings, genres, cover art, and release dates.

---

## Project Structure

```
game-preservation/
├── apps/
│   └── game-ako/          # Next.js web application
├── .asd/artifacts/        # Python IGDB data fetcher
├── specs/                 # Feature specifications and plans
├── docs/                  # Project documentation
└── .specify/              # Speckit workflow configuration
```
