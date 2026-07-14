# PS Vita Exclusives – IGDB Fetcher

Fetches **PS Vita exclusive** games from the [IGDB API](https://api-docs.igdb.com/) and
saves the results as a JSON file in the same folder.

## What It Does

- Queries IGDB for games released **only** on PS Vita (`platforms = [46]`).
- Excludes ports, remasters, DLC, and bundles.
- Filters for games that were released in the **English market** (Europe, North
  America, Australia).
- Optionally fetches **Japan-only** exclusives (games released in Japan but
  never in an English-speaking region).
- Outputs a clean JSON file with metadata, ratings, genres, cover art, and
  release-date details.

## Prerequisites

| Requirement  | How to get it                                                          |
| ------------ | ---------------------------------------------------------------------- |
| **Python**   | 3.7 or newer.  Download from [python.org](https://www.python.org/)     |
| **requests** | `pip install requests`                                                 |
| **python-dotenv** *(optional)* | `pip install python-dotenv` – only needed if you use a `.env` file |

### How to install Python (Windows)

1. Download the installer from [python.org/downloads](https://www.python.org/downloads/).
2. Run the installer. **Check the box "Add Python to PATH"**.
3. Open **Command Prompt** and verify:
   ```
   python --version
   ```
4. Install the required package:
   ```
   pip install requests
   ```

## IGDB API Credentials

IGDB uses **Twitch OAuth**. You need to register a Twitch application at
[dev.twitch.tv](https://dev.twitch.tv/docs/authentication/register-app/)
to get your credentials. There are **three** values involved:

| Credential | What it is | Used for |
|---|---|---|
| **Client-ID** | Public identifier of your Twitch app | Sent in every API request |
| **Client Secret** | Private key *(keep this safe)* | Exchanged **once** to generate a token |
| **Bearer Token** | A temporary access token | Sent as `Authorization: Bearer <...>` in every request |

> **The Client Secret is NOT the Bearer Token.**  
> The secret is used just one time to obtain a token. Only the token (and the
> Client-ID) are sent to IGDB with each request.

### Easiest way: provide Client-ID + Client Secret

The script will **auto-generate** the token for you so you never have to deal
with tokens manually:

```bash
python fetch_ps_vita_exclusives.py --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET
```

### Alternative: provide a pre-existing Bearer Token

If you already have a token (e.g. from the IGDB website or a previous OAuth
exchange), supply it directly:

```bash
python fetch_ps_vita_exclusives.py --client-id YOUR_CLIENT_ID --token YOUR_ACCESS_TOKEN
```

### Environment variables / `.env` file

Create a `.env` file in the script's folder:

```
IGDB_CLIENT_ID=YOUR_CLIENT_ID
IGDB_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

Or set them in your shell:

```cmd
set IGDB_CLIENT_ID=YOUR_CLIENT_ID
set IGDB_CLIENT_SECRET=YOUR_CLIENT_SECRET
python fetch_ps_vita_exclusives.py
```

The script resolves credentials in this order: **CLI flags → env vars → `.env`**.

## Usage

```bash
# Auto-generate token from Client Secret (recommended)
python fetch_ps_vita_exclusives.py --client-id abc --client-secret xyz

# Use a manually-obtained Bearer Token
python fetch_ps_vita_exclusives.py --client-id abc --token xyz

# Japan-only exclusives (no English release)
python fetch_ps_vita_exclusives.py --client-id abc --client-secret xyz --japan-only

# Custom output path
python fetch_ps_vita_exclusives.py --client-id abc --client-secret xyz --output vita_games.json

# Increase HTTP timeout (useful on slow connections)
python fetch_ps_vita_exclusives.py --client-id abc --client-secret xyz --timeout 60
```

### Full argument reference

| Flag               | Description                                          | Env var               |
| ------------------ | ---------------------------------------------------- | --------------------- |
| `--client-id`      | IGDB / Twitch Client-ID **(required)**               | `IGDB_CLIENT_ID`      |
| `--client-secret`  | Twitch Client Secret – script auto-generates a token | `IGDB_CLIENT_SECRET`  |
| `--token`          | Pre-existing Bearer Token *(optional if secret given)* | `IGDB_TOKEN`         |
| `--japan-only`     | Japan-exclusive Vita games (no English release)      | —                     |
| `--output`         | Output JSON file path *(default: `ps_vita_exclusives.json`)* | —            |
| `--timeout`        | HTTP request timeout in seconds *(default: 30)*      | —                     |

> You must provide **either** `--client-secret` **or** `--token` (or their env
> var equivalents). The script will auto-detect which one you used.

## Output Format

The JSON file contains a `metadata` block and a `games` array:

```json
{
  "metadata": {
    "source": "IGDB API v4",
    "query": "PS Vita exclusives (category=0, version_parent=null)",
    "mode": "English-market exclusives",
    "total": 150
  },
  "games": [
    {
      "id": 1024,
      "name": "Game Name",
      "slug": "game-name",
      "url": "https://www.igdb.com/games/game-name",
      "summary": "Game description...",
      "first_release_date": 1356998400,
      "rating": 85.5,
      "rating_count": 120,
      "cover_url": "https://images.igdb.com/.../t_cover_big.jpg",
      "genres": ["Adventure", "RPG"],
      "themes": ["Fantasy"],
      "game_modes": ["Single player"],
      "releases": [
        {
          "date": "2012-12-17",
          "region": "North America",
          "type": "released"
        },
        {
          "date": "2012-12-19",
          "region": "Europe",
          "type": "released"
        }
      ]
    }
  ]
}
```

## Filtering Logic

The script applies these criteria sequentially:

| Step | Criterion                                             | Where applied         |
| ---- | ----------------------------------------------------- | --------------------- |
| 1    | Platforms = `[46]` **only** (PS Vita exclusive)       | IGDB server-side      |
| 2    | `category = 0` (main game, not DLC / bundle)          | IGDB server-side      |
| 3    | `version_parent = null` (not a port or remaster)      | IGDB server-side      |
| 4    | Released in Europe, North America, or Australia       | Client-side filter    |
| 5\*   | Released in Japan **and not** in English regions      | Client-side filter    |

\* Only when `--japan-only` is used.

## Notes

- IGDB's free tier allows ~4 requests per second. The script automatically
  adds a short delay between pages and retries on rate-limit (HTTP 429).
- A total of 1 000–2 000 PS Vita games exist in IGDB. After filtering, expect
  roughly **150–300** English-market exclusives.
- Cover-art URLs use the `t_cover_big` size. Replace with `t_1080p`,
  `t_720p`, or `t_thumb` in the output file if you need a different size.
