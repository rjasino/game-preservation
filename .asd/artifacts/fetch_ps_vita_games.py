#!/usr/bin/env python3
"""
IGDB PS Vita Games Fetcher
===========================

Fetches ALL PlayStation Vita games from the IGDB API (https://api-docs.igdb.com/)
that meet the following criteria:

    - All PS Vita games ever released (platform ID 46)
    - Released to the English market (Europe, North America, Australia)
    - Includes both physical (retail cartridge) and digital (PSN) releases
    - Metadata added to help identify physical-only vs digital-only releases
    - Optional: Japan-market exclusives only
    - Includes all platforms each game was released on (not just PS Vita)

Authentication
--------------
IGDB uses Twitch OAuth.  You need two (or three) values:

    ┌─────────────────┬─────────────────────────────────────────────────┐
    │ Client-ID       │ Public  – identifies your registered Twitch app │
    │ Client Secret   │ Private – used ONCE to obtain a Bearer Token   │
    │ Bearer Token    │ The actual access token sent with every request │
    └─────────────────┴─────────────────────────────────────────────────┘

You can supply credentials in two ways:

    1. --client-id + --client-secret  → script auto-generates the token
    2. --client-id + --token           → script uses your existing token

Or via env vars / .env file: IGDB_CLIENT_ID, IGDB_CLIENT_SECRET, IGDB_TOKEN.

References
----------
    - IGDB API v4:  https://api-docs.igdb.com/#getting-started
    - Platform IDs: https://www.igdb.com/platforms  (PS Vita = 46)
    - Twitch OAuth: https://dev.twitch.tv/docs/authentication
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Third-party imports (with friendly error messages)
# ---------------------------------------------------------------------------
try:
    import requests  # type: ignore[import-untyped]
except ImportError:
    print("The 'requests' library is required but not installed.")
    print("Install it with:  pip install requests")
    sys.exit(1)


# ============================================================================
# Constants
# ============================================================================

IGDB_BASE_URL: str = "https://api.igdb.com/v4"
PS_VITA_PLATFORM_ID: int = 46

# Rate-limiting: IGDB free tier allows ~4 requests/second
REQUEST_DELAY_SEC: float = 0.30
PAGE_LIMIT: int = 500  # max results per page

# Region matching uses the ``name`` field from IGDB's /v4/regions endpoint
# (accessed via ``release_dates.release_region.region.name``).
# The old integer ``region`` enum is DEPRECATED and sparsely populated for Vita.
ENGLISH_REGION_NAMES: set = {
    "europe",
    "north_america",
    "australia",
    "new zealand",
    "worldwide",
}

# Global tally of release regions seen while processing games.
# Example: {"worldwide": 120, "japan": 340}
REGION_TALLY: Dict[str, int] = {}

MAIN_GAME_CATEGORY: int = 0

# Keywords in ``version_title`` that identify special / deluxe / collector
# editions — these are excluded per the query spec.
_EXCLUDED_EDITION_KEYWORDS: tuple = (
    "special edition",
    "deluxe edition",
    "collector",
    "limited edition",
    "game of the year",
    "ultimate edition",
    "gold edition",
    "complete edition",
    "premium edition",
)


# ============================================================================
# Credential helpers
# ============================================================================

# Twitch OAuth endpoint used to exchange Client-ID + Client Secret for a token
OAUTH_TOKEN_URL: str = "https://id.twitch.tv/oauth2/token"


def _load_dotenv(search_dir: Path) -> None:
    """Attempt to load a ``.env`` file if ``python-dotenv`` is installed."""
    env_path = search_dir / ".env"
    if not env_path.is_file():
        return
    try:
        from dotenv import load_dotenv as _loader  # type: ignore[import-untyped]
    except ImportError:
        return  # python-dotenv not installed – silently skip
    _loader(dotenv_path=str(env_path))


def _fetch_bearer_token(client_id: str, client_secret: str, timeout: float) -> str:
    """
    Exchange a Client-ID + Client Secret for a short-lived Bearer Token
    using Twitch's OAuth client-credentials flow.

    This is the **only** time the Client Secret is used – it is never sent
    directly to the IGDB API itself.
    """
    print("  Exchanging Client Secret for Bearer Token ...", end=" ", flush=True)
    try:
        resp = requests.post(
            OAUTH_TOKEN_URL,
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "grant_type": "client_credentials",
            },
            timeout=timeout,
        )
        print(resp.status_code, end=" ", flush=True)
    except requests.RequestException as exc:
        print(f"FAILED")
        print(f"  Network error contacting Twitch OAuth: {exc}")
        sys.exit(1)

    if not resp.ok:
        print(f"FAILED (HTTP {resp.status_code})")
        print(f"  {resp.text.strip()[:500]}")
        sys.exit(1)

    body = resp.json()
    token: Optional[str] = body.get("access_token")
    if not token:
        print("FAILED – no access_token in response")
        sys.exit(1)

    expires: int = body.get("expires_in", 0)
    print(f"OK (expires in {expires:,d} s)")
    return token


def resolve_credentials(args: argparse.Namespace) -> Tuple[str, str]:
    """
    Determine ``(client_id, bearer_token)``.

    Priority order:
        1. CLI flags (--client-id, --token, --client-secret)
        2. Environment variables (IGDB_CLIENT_ID, IGDB_TOKEN, IGDB_CLIENT_SECRET)
        3. ``.env`` file

    If a *Client Secret* is provided (via --client-secret or env var) and no
    *Bearer Token* is provided, the script automatically exchanges the secret
    for a token using Twitch's OAuth endpoint.
    """
    client_id: Optional[str] = args.client_id or os.environ.get("IGDB_CLIENT_ID")
    token: Optional[str] = args.token or os.environ.get("IGDB_TOKEN")
    client_secret: Optional[str] = args.client_secret or os.environ.get(
        "IGDB_CLIENT_SECRET"
    )
    print(f"  Client-ID: {client_id or '(not provided)'}")
    print(f"  Client-Secret: {'(not provided)' if not client_secret else '(provided)'}")

    if not client_id:
        print("ERROR: IGDB / Twitch Client-ID is required.")
        print("Supply it via --client-id, IGDB_CLIENT_ID env var, or .env file.")
        sys.exit(1)

    # If the user gave us a token directly, use it
    if token:
        return client_id, token

    # Otherwise, try to generate one from the Client Secret
    if client_secret:
        token = _fetch_bearer_token(client_id, client_secret, args.timeout)
        return client_id, token

    # Neither token nor secret – can't proceed
    print("ERROR: No Bearer Token or Client Secret provided.")
    print()
    print("You must supply EITHER:")
    print("  1. --token / IGDB_TOKEN       (a pre-existing Bearer Token), or")
    print("  2. --client-secret / IGDB_CLIENT_SECRET  (auto-generate a token)")
    print()
    print("The Client Secret is NOT the same thing as the Bearer Token.")
    print("See the README or --help for details.")
    sys.exit(1)


# ============================================================================
# IGDB API helpers
# ============================================================================


def _build_headers(client_id: str, token: str) -> Dict[str, str]:
    """Construct the HTTP headers required by the IGDB API."""
    return {
        "Client-ID": client_id,
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }


def _igdb_post(
    endpoint: str, query: str, headers: Dict[str, str], timeout: float = 30
) -> List[Dict[str, Any]]:
    """
    Send a POST request to the IGDB API.

    On a 429 (rate-limit) response the call waits 5 s and retries once.
    """
    url = f"{IGDB_BASE_URL}/{endpoint}"

    for attempt in (1, 2):
        try:
            resp = requests.post(url, headers=headers, data=query, timeout=timeout)
        except requests.RequestException as exc:
            if attempt == 2:
                print(f"  Network error after retry: {exc}")
                return []
            print(f"  Network error, retrying ({exc})...")
            time.sleep(2)
            continue

        if resp.status_code == 429:
            print("  Rate-limited – waiting 5 s ...")
            time.sleep(5)
            continue  # retry

        if not resp.ok:
            print(f"  API error {resp.status_code}: {resp.text.strip()[:500]}")
            return []

        return resp.json()

    return []


def _fields_query() -> str:
    """Return the comma-separated list of fields to request from IGDB."""
    return (
        "name,summary,first_release_date,slug,url,"
        "category,version_title,version_parent,"
        "genres.name,themes.name,game_modes.name,platforms.name,"
        "involved_companies.company.name,involved_companies.developer,"
        "involved_companies.publisher,"
        "total_rating,total_rating_count,rating,rating_count,"
        "cover.url,"
        "release_dates.category,release_dates.date,"
        "release_dates.human,release_dates.platform,"
        "release_dates.release_region.region,"
        "release_dates.status.name"
    )


def fetch_all_games(
    client_id: str, token: str, timeout: float = 30
) -> List[Dict[str, Any]]:
    """
    Paginate through the IGDB ``/games`` endpoint and return every PS Vita
    game that meets the initial server-side filter:

    * ``platforms = (46)`` → **only** PS Vita

    Unlike the previous query, **no** ``version_parent`` filter is applied,
    so all regional variants, ports, and re-releases are included.

    The ``category`` field is inconsistently populated for Vita records in IGDB,
    so main-game filtering happens client-side instead of in the query.
    """
    headers = _build_headers(client_id, token)
    all_games: List[Dict[str, Any]] = []
    offset: int = 0
    fields = _fields_query()

    while True:
        query = (
            f"fields {fields};"
            f"where platforms = ({PS_VITA_PLATFORM_ID});"
            f"sort first_release_date desc;"
            f"limit {PAGE_LIMIT};"
            f"offset {offset};"
        )

        print(f"  Page offset {offset} ...", end=" ", flush=True)
        results = _igdb_post("games", query, headers, timeout=timeout)
        print(f"{len(results)} results")

        if not results:
            break

        all_games.extend(results)

        if len(results) < PAGE_LIMIT:
            break

        offset += PAGE_LIMIT
        time.sleep(REQUEST_DELAY_SEC)

    print(f"  Total raw results (before region filter): {len(all_games)}")
    return all_games


# ============================================================================
# Post-query filtering & data cleaning
# ============================================================================


def _determine_release_formats(game: Dict[str, Any]) -> str:
    """
    Best-effort heuristic to classify a PS Vita game's release format.

    IGDB does **not** expose an explicit physical/digital flag, so this
    function uses available metadata to produce a reasonable guess:

    * ``"physical_and_digital"`` – likely had both cart & PSN releases
    * ``"digital_likely"``      – no evidence of a physical release
    * ``"unknown"``             – not enough data to decide

    Heuristic rules (applied in order):
        1. Games that are a **version** of another game (``version_parent``
           is not null) are assumed digital-only – these are typically
           regional variants, special editions, or PSN-only re-releases.
        2. If the game has at least one ``release_dates`` entry targeting
           the PS Vita platform, we assume a physical cartridge release
           existed (Vita-native release-date records are the best proxy
           available — ``status`` and ``region`` fields are often omitted
           by IGDB for Vita entries).
        3. Otherwise fall back to ``"digital_likely"`` (since all PS Vita
           games were available digitally via PSN).
    """
    # Versions / variants are digital-only by convention
    if game.get("version_parent"):
        return "digital_likely"

    release_dates: List[Dict] = game.get("release_dates") or []

    # Look for at least one release-date entry on the Vita platform.
    # We do NOT check ``status`` here — IGDB frequently omits ``status``
    # and ``region`` for PS Vita entries.  A release-date record whose
    # ``platform`` is 46 (PS Vita) is the most reliable indicator that
    # the game actually shipped on the platform.
    has_vita_release = any(
        rd.get("platform") == PS_VITA_PLATFORM_ID for rd in release_dates
    )

    if has_vita_release:
        return "physical_and_digital"

    # If we have release dates but none specifically on Vita,
    # it is still a Vita game (the query filtered by platform=46),
    # but the release metadata is sparse — treat as digital-only.
    if release_dates:
        return "digital_likely"

    return "unknown"


def _has_english_release(game: Dict[str, Any]) -> bool:
    """Return ``True`` if the game has at least one release in an
    English-market region (Europe, North America, Australia, New Zealand).

    Uses the IGDB v4 ``release_region.region`` path which returns the
    region string directly — the old integer ``region`` enum is deprecated.
    """
    release_dates: List[Dict] = game.get("release_dates") or []
    if not release_dates:
        # Fallback: a non-null first_release_date *probably* means English
        return bool(game.get("first_release_date"))

    # Collect all region names present in the release data
    region_names: set = set()
    for rd in release_dates:
        rr = rd.get("release_region") or {}
        region = rr.get("region")
        if region:
            region_names.add(region)
            REGION_TALLY[region] = REGION_TALLY.get(region, 0) + 1

    if not region_names:
        # IGDB may not have backfilled release_region for every Vita entry yet.
        # Fall back to the broader release timestamp instead of excluding data.
        return bool(game.get("first_release_date"))

    return bool(region_names & ENGLISH_REGION_NAMES)


def _is_excluded_edition(game: Dict[str, Any]) -> bool:
    """Return ``True`` if the game is a special / deluxe / collector edition
    variant that should be excluded per the query spec.

    Only checks games that have a ``version_parent`` (i.e. they are a variant
    of another game), then matches ``version_title`` against known edition
    keywords.
    """
    if not game.get("version_parent"):
        return False
    version_title = (game.get("version_title") or "").lower()
    for keyword in _EXCLUDED_EDITION_KEYWORDS:
        if keyword in version_title:
            return True
    return False


def _clean_game(game: Dict[str, Any]) -> Dict[str, Any]:
    """Convert a raw IGDB game object into the output schema."""
    name: str = game.get("name") or "Unknown"
    slug: str = game.get("slug") or ""
    cover: Dict = game.get("cover") or {}

    # Build a clean cover URL (IGDB returns "//images.igdb.com/..." paths)
    cover_url: str = ""
    raw_cover: Optional[str] = cover.get("url")
    if raw_cover:
        cover_url = f"https:{raw_cover.replace('t_thumb', 't_cover_big')}"

    # Collect genre / theme / game-mode / platform names
    genres: List[str] = [g["name"] for g in (game.get("genres") or []) if g.get("name")]
    themes: List[str] = [t["name"] for t in (game.get("themes") or []) if t.get("name")]
    game_modes: List[str] = [
        m["name"] for m in (game.get("game_modes") or []) if m.get("name")
    ]
    platforms: List[str] = [
        p["name"] for p in (game.get("platforms") or []) if p.get("name")
    ]

    # Developers & publishers from involved_companies
    developers: List[str] = []
    publishers: List[str] = []
    for ic in game.get("involved_companies") or []:
        company = ic.get("company") or {}
        company_name = company.get("name")
        if not company_name:
            continue
        if ic.get("developer"):
            developers.append(company_name)
        if ic.get("publisher"):
            publishers.append(company_name)

    # Release dates – boiled down to a simple list with status info
    releases: List[Dict[str, str]] = []
    for rd in game.get("release_dates") or []:
        release_entry: Dict[str, str] = {
            "date": rd.get("human") or "",
        }

        # release_dates.release_region.region returns the region as a string
        region_name = rd.get("release_region", {}).get("region") or ""
        release_entry["region"] = region_name

        # release_dates.status.name returns the status as a string
        status_name = rd.get("status", {}).get("name") or "released"
        release_entry["status"] = status_name

        releases.append(release_entry)

    # Determine physical / digital release format (best-effort heuristic)
    release_formats = _determine_release_formats(game)

    return {
        "id": game.get("id"),
        "name": name,
        "slug": slug,
        "url": game.get("url") or f"https://www.igdb.com/games/{slug}",
        "summary": game.get("summary") or "",
        "first_release_date": game.get("first_release_date"),
        "rating": game.get("total_rating"),
        "rating_count": game.get("total_rating_count"),
        "cover_url": cover_url,
        "genres": genres,
        "themes": themes,
        "game_modes": game_modes,
        "platforms": platforms,
        "developers": developers,
        "publishers": publishers,
        "is_version": bool(game.get("version_parent")),
        "version_title": game.get("version_title") or "",
        "release_formats": release_formats,
        "releases": releases,
    }


def filter_games(raw_games: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Client-side filtering loop.

    Keeps only games that:
    * Are main games (``category == 0`` — excludes DLC, expansions, bundles).
    * Have an English-market release.
    * Are **not** a special / deluxe / collector edition variant.
    """
    filtered: List[Dict[str, Any]] = []

    for game in raw_games:
        category = game.get("category")
        if category is not None and category != MAIN_GAME_CATEGORY:
            continue

        if not _has_english_release(game):
            continue

        if _is_excluded_edition(game):
            continue

        filtered.append(_clean_game(game))

    return filtered


# ============================================================================
# CLI
# ============================================================================


def _parse_args() -> argparse.Namespace:
    """Define and parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Fetch all PS Vita games from the IGDB API.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "examples:\n"
            "  # Use Client-ID + Client Secret (script auto-generates the token)\n"
            "  python .asd/artifacts/fetch_ps_vita_games.py --client-id YOUR_ID --client-secret YOUR_SECRET\n\n"
            "  # Use a pre-existing Bearer Token\n"
            "  python .asd/artifacts/fetch_ps_vita_games.py --client-id YOUR_ID --token YOUR_TOKEN\n\n"
            "  # Environment variables (no CLI flags needed)\n"
            "  set IGDB_CLIENT_ID=YOUR_ID\n"
            "  set IGDB_CLIENT_SECRET=YOUR_SECRET\n"
            "  python .asd/artifacts/fetch_ps_vita_games.py\n"
        ),
    )

    parser.add_argument(
        "--client-id",
        default=None,
        help="IGDB / Twitch Client-ID (falls back to IGDB_CLIENT_ID env var).",
    )
    parser.add_argument(
        "--client-secret",
        default=None,
        help=(
            "Twitch Client Secret. The script will use this to auto-generate "
            "a Bearer Token. Falls back to IGDB_CLIENT_SECRET env var. "
            "This is NOT the same as the Bearer Token."
        ),
    )
    parser.add_argument(
        "--token",
        default=None,
        help=(
            "IGDB Bearer (Access) Token – a pre-generated token from Twitch OAuth. "
            "Falls back to IGDB_TOKEN env var. "
            "If you provide --client-secret instead, this is optional."
        ),
    )
    parser.add_argument(
        "--output",
        default="ps_vita_games.json",
        help=(
            "Output JSON file path. "
            "Relative paths are resolved from '.asd/artifacts'. "
            "Defaults to '.asd/artifacts/ps_vita_games.json'."
        ),
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=30.0,
        help="HTTP request timeout in seconds (default: 30).",
    )
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    artifact_dir = Path(__file__).resolve().parent
    project_root = artifact_dir.parent.parent

    # Load .env from the project root first, then from the artifact folder.
    _load_dotenv(project_root)
    _load_dotenv(artifact_dir)

    # Resolve credentials (exits on failure)
    client_id, token = resolve_credentials(args)

    print("=" * 56)
    print("  IGDB PS Vita Games Fetcher")
    print(f"  Mode: English-market games")
    print(f"  Output: {args.output}")
    print("=" * 56)

    # ------------------------------------------------------------------
    # 1. Fetch raw games from the API
    # ------------------------------------------------------------------
    print("\n[1/2] Fetching games from IGDB API ...")
    raw_games = fetch_all_games(client_id, token, timeout=args.timeout)

    if not raw_games:
        print("  No games returned from the API. Double-check your credentials.")
        sys.exit(1)

    # ------------------------------------------------------------------
    # 2. Filter client-side and clean the data
    # ------------------------------------------------------------------
    print(f"\n[2/2] Applying filters (English market, exclude editions) ...")
    filtered = filter_games(raw_games)
    print(f"  Matching games: {len(filtered)}")
    print(f"  Region tally (all fetched release entries): {REGION_TALLY}")

    # ------------------------------------------------------------------
    # 3. Write JSON output
    # ------------------------------------------------------------------
    output_path = Path(args.output)
    if not output_path.is_absolute():
        output_path = artifact_dir / output_path
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "metadata": {
                    "source": "IGDB API v4",
                    "query": "PS Vita games (English market; DLC & special/deluxe/collector editions excluded)",
                    "mode": "English-market games",
                    "total": len(filtered),
                    "note": "release_formats is best-effort based on IGDB metadata heuristics",
                },
                "games": filtered,
            },
            f,
            indent=2,
            ensure_ascii=False,
        )

    print(f"\nDone  --  {len(filtered)} games written to {output_path.resolve()}")


if __name__ == "__main__":
    main()
