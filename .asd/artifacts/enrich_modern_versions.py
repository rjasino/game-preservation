#!/usr/bin/env python3
"""
IGDB Modern Version Enrichment
==============================

For each at-risk PS Vita game (Critical or High preservation risk level),
queries IGDB for relationship fields (``remakes``, ``remasters``, ``ports``,
``expanded_games``) to discover whether a modern port, remaster, or remake
version exists on more widely available platforms.

Output
------
Writes ``modern_versions_enrichment.json`` mapping each original game ID to:

    {
      "game_id": <original IGDB id>,
      "modern_versions": [
        {
          "id": <related game id>,
          "name": <related game name>,
          "relation": "remaster" | "remake" | "port" | "expanded",
          "platforms": [...],
          "risk_level": "Critical" | ... | "Minimal",
          "ecosystem_families": ["Sony", "PC", ...],
          "salvages_original": true | false
        }
      ],
      "exclude_from_at_risk": true | false,
      "exclusion_reason": "Remaster available on PC/Switch/PS5" | null
    }

If ``exclude_from_at_risk`` is ``true``, the original Vita game is considered
"salvaged" by a widely available modern version and can be filtered out of
at-risk reports.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Union

# ---------------------------------------------------------------------------
# Third-party imports
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
REQUEST_DELAY_SEC: float = 0.30
PAGE_LIMIT: int = 500
BATCH_SIZE: int = 100  # max IDs per IGDB where-clause

OAUTH_TOKEN_URL: str = "https://id.twitch.tv/oauth2/token"

# Relationship fields on the IGDB game object
RELATIONSHIP_FIELDS: List[Tuple[str, str]] = [
    ("remakes", "remake"),
    ("remasters", "remaster"),
    ("ports", "port"),
    ("expanded_games", "expanded"),
]

# ---------------------------------------------------------------------------
# Platform family mapping (mirrors TypeScript preservation.ts)
# ---------------------------------------------------------------------------

PLATFORM_FAMILY_RULES: List[Tuple[str, List[str]]] = [
    (
        "Sony",
        [
            "PlayStation Vita",
            "PlayStation Portable",
            "PSP",
            "PlayStation 5",
            "PlayStation 4",
            "PlayStation 3",
            "PlayStation 2",
            "PlayStation",
        ],
    ),
    (
        "PC",
        [
            "PC (Microsoft Windows)",
            "Windows",
            "Mac",
            "Linux",
        ],
    ),
    (
        "Nintendo",
        [
            "Nintendo Switch",
            "Nintendo 3DS",
            "Nintendo Wii U",
            "Nintendo Wii",
            "Nintendo GameCube",
            "Nintendo DS",
            "Nintendo DSi",
            "Wii",
            "GameCube",
        ],
    ),
    (
        "Xbox",
        [
            "Xbox Series X|S",
            "Xbox One",
            "Xbox 360",
            "Xbox",
        ],
    ),
    (
        "Mobile",
        [
            "iOS",
            "Android",
        ],
    ),
    (
        "Web",
        [
            "Web browser",
            "Browser",
        ],
    ),
]


# ============================================================================
# Credential helpers (reused from fetch_ps_vita_games.py)
# ============================================================================


def _load_dotenv(search_dir: Path) -> None:
    """Attempt to load a ``.env`` file if ``python-dotenv`` is installed."""
    env_path = search_dir / ".env"
    if not env_path.is_file():
        return
    try:
        from dotenv import load_dotenv as _loader  # type: ignore[import-untyped]
    except ImportError:
        return
    _loader(dotenv_path=str(env_path))


def _fetch_bearer_token(client_id: str, client_secret: str, timeout: float) -> str:
    """Exchange Client-ID + Client Secret for a Bearer Token."""
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
    """Resolve (client_id, bearer_token) from CLI/env/.env."""
    client_id: Optional[str] = args.client_id or os.environ.get("IGDB_CLIENT_ID")
    token: Optional[str] = args.token or os.environ.get("IGDB_TOKEN")
    client_secret: Optional[str] = args.client_secret or os.environ.get(
        "IGDB_CLIENT_SECRET"
    )

    if not client_id:
        print("ERROR: IGDB Client-ID is required.")
        sys.exit(1)

    if token:
        return client_id, token

    if client_secret:
        token = _fetch_bearer_token(client_id, client_secret, args.timeout)
        return client_id, token

    print("ERROR: No Bearer Token or Client Secret provided.")
    sys.exit(1)


# ============================================================================
# IGDB API helpers
# ============================================================================


def _build_headers(client_id: str, token: str) -> Dict[str, str]:
    return {
        "Client-ID": client_id,
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }


def _igdb_post(
    endpoint: str, query: str, headers: Dict[str, str], timeout: float = 30
) -> List[Dict[str, Any]]:
    """Send a POST request to the IGDB API with retry on 429."""
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
            continue

        if not resp.ok:
            print(f"  API error {resp.status_code}: {resp.text.strip()[:500]}")
            return []

        return resp.json()

    return []


# ============================================================================
# Platform Classification (Python mirror of preservation.ts)
# ============================================================================


def classify_platform_name(raw: str) -> str:
    """Classify a raw IGDB platform name into an ecosystem family."""
    lower = raw.lower()
    for family, keywords in PLATFORM_FAMILY_RULES:
        for kw in keywords:
            if kw.lower() in lower:
                return family
    return "Other"


def classify_platforms(platforms: List[str]) -> Set[str]:
    """Classify a list of platform names into deduplicated ecosystem families."""
    families: Set[str] = set()
    for p in platforms:
        families.add(classify_platform_name(p))
    return families


def assess_risk(platforms: List[str]) -> Dict[str, Any]:
    """
    Deterministic risk assessment mirroring TypeScript assessEndangerment.
    Returns {score, level, reasons, ecosystemFamilies}.
    """
    if not platforms:
        return {
            "score": 60,
            "level": "Medium",
            "reasons": ["No platform data available"],
            "ecosystem_families": [],
        }

    families = classify_platforms(platforms)
    family_list = sorted(families)
    has_pc = "PC" in families
    has_mobile = "Mobile" in families
    has_web = "Web" in families
    has_open = has_pc or has_mobile or has_web
    is_sony_only = len(families) == 1 and "Sony" in families

    # Critical: Vita-only
    if len(platforms) == 1 and classify_platform_name(platforms[0]) == "Sony":
        vita_only = all("vita" in p.lower() for p in platforms)
        if vita_only:
            return {
                "score": 100,
                "level": "Critical",
                "reasons": ["Only released on PlayStation Vita"],
                "ecosystem_families": family_list,
            }

    # High: Sony-only
    if is_sony_only:
        return {
            "score": 80,
            "level": "High",
            "reasons": ["Locked to Sony platforms"],
            "ecosystem_families": family_list,
        }

    # Medium: closed ecosystems, no PC/Web/Mobile
    if not has_open:
        return {
            "score": 60,
            "level": "Medium",
            "reasons": [
                "No PC, web, or mobile release found",
                f"Locked to {'/'.join(family_list)} platforms",
            ],
            "ecosystem_families": family_list,
        }

    # Minimal: 3+ families AND open ecosystem
    if len(families) >= 3 and has_open:
        return {
            "score": 10,
            "level": "Minimal",
            "reasons": [
                f"Available across {len(families)} platform families ({', '.join(family_list)})",
                "Preservation risk is low due to wide availability",
            ],
            "ecosystem_families": family_list,
        }

    # Low: has PC/Web/Mobile
    open_fams = []
    if has_pc:
        open_fams.append("PC")
    if has_mobile:
        open_fams.append("mobile")
    if has_web:
        open_fams.append("web")

    return {
        "score": 30,
        "level": "Low",
        "reasons": [
            f"Available on {', '.join(open_fams)}, so preservation risk is lower",
        ],
        "ecosystem_families": family_list,
    }


# ============================================================================
# Main Enrichment Logic
# ============================================================================


def load_games(data_path: Path) -> List[Dict[str, Any]]:
    """Load the games array from the data JSON file."""
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("games", [])


def identify_at_risk_games(games: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Return games classified as Critical or High risk."""
    at_risk: List[Dict[str, Any]] = []
    for g in games:
        assessment = assess_risk(g.get("platforms", []))
        if assessment["level"] in ("Critical", "High"):
            at_risk.append(g)
    return at_risk


def chunk_list(lst: List[Any], size: int) -> List[List[Any]]:
    """Split a list into chunks of the given size."""
    return [lst[i : i + size] for i in range(0, len(lst), size)]


def fetch_relationships(
    game_ids: List[int], headers: Dict[str, str], timeout: float
) -> Dict[int, Dict[str, List[int]]]:
    """
    Query IGDB for relationship fields of a batch of game IDs.
    Returns a dict mapping game_id -> {relation_type: [related_ids]}.
    """
    result: Dict[int, Dict[str, List[int]]] = {}
    # Build fields string: include id + all relationship fields
    rel_fields = ", ".join(rf[0] for rf in RELATIONSHIP_FIELDS)
    fields = f"id,{rel_fields}"

    for chunk in chunk_list(game_ids, BATCH_SIZE):
        ids_str = ", ".join(str(i) for i in chunk)
        query = f"fields {fields};where id = ({ids_str});limit {BATCH_SIZE};"

        print(
            f"  Fetching relationships for {len(chunk)} games ...", end=" ", flush=True
        )
        rows = _igdb_post("games", query, headers, timeout=timeout)
        print(f"{len(rows)} results")

        for row in rows:
            gid = row.get("id")
            if not gid:
                continue
            relations: Dict[str, List[int]] = {}
            for field_name, _ in RELATIONSHIP_FIELDS:
                val = row.get(field_name)
                if isinstance(val, list):
                    cleaned: List[int] = []
                    for v in val:
                        if v is None:
                            continue
                        if isinstance(v, dict):
                            vid = v.get("id")
                            if isinstance(vid, int):
                                cleaned.append(vid)
                        elif isinstance(v, int):
                            cleaned.append(v)
                    relations[field_name] = cleaned
                else:
                    relations[field_name] = []
            result[gid] = relations

        time.sleep(REQUEST_DELAY_SEC)

    return result


def fetch_platforms(
    game_ids: List[int], headers: Dict[str, str], timeout: float
) -> Dict[int, Dict[str, Any]]:
    """
    Query IGDB for platform + name data for a batch of game IDs.
    Returns dict mapping game_id -> {id, name, slug, platforms: [names], url}.
    """
    result: Dict[int, Dict[str, Any]] = {}
    if not game_ids:
        return result

    for chunk in chunk_list(game_ids, BATCH_SIZE):
        ids_str = ", ".join(str(i) for i in chunk)
        query = (
            f"fields id,name,slug,url,platforms.name;"
            f"where id = ({ids_str});"
            f"limit {BATCH_SIZE};"
        )

        print(
            f"  Fetching platform data for {len(chunk)} related games ...",
            end=" ",
            flush=True,
        )
        rows = _igdb_post("games", query, headers, timeout=timeout)
        print(f"{len(rows)} results")

        for row in rows:
            gid = row.get("id")
            if not gid:
                continue
            platforms = [
                p["name"] for p in (row.get("platforms") or []) if p.get("name")
            ]
            result[gid] = {
                "id": gid,
                "name": row.get("name") or "Unknown",
                "slug": row.get("slug") or "",
                "url": row.get("url") or "",
                "platforms": platforms,
            }

        time.sleep(REQUEST_DELAY_SEC)

    return result


def is_broadly_available(related_game: Dict[str, Any]) -> bool:
    """
    A related game is considered "broadly available" if:
      - It has PC in its platforms, OR
      - It spans 3+ ecosystem families AND has an open ecosystem (PC/Mobile/Web)

    In other words, the related game would score Low or Minimal in our risk model.
    """
    assessment = assess_risk(related_game.get("platforms", []))
    return assessment["level"] in ("Low", "Minimal")


def enrich_at_risk_games(
    at_risk: List[Dict[str, Any]],
    headers: Dict[str, str],
    timeout: float,
) -> List[Dict[str, Any]]:
    """
    For each at-risk game, fetch relationship data from IGDB, then fetch
    platform data for related games, classify them, and produce enrichment records.
    """
    at_risk_by_id: Dict[int, Dict[str, Any]] = {g["id"]: g for g in at_risk}
    at_risk_ids = list(at_risk_by_id.keys())
    print(f"\nAt-risk games to enrich: {len(at_risk_ids)}")

    # Phase 1: Fetch relationship data for at-risk games
    print("\n--- Phase 1: Fetching relationship data ---")
    relationships = fetch_relationships(at_risk_ids, headers, timeout)

    # Phase 2: Collect all unique related game IDs
    all_related_ids: Set[int] = set()
    game_relations: Dict[int, List[Tuple[str, int]]] = defaultdict(list)
    for gid, rels in relationships.items():
        for field_name, related_ids in rels.items():
            for rid in related_ids:
                if rid and rid != gid:
                    all_related_ids.add(rid)
                    game_relations[gid].append((field_name, rid))

    print(
        f"\nFound {len(all_related_ids)} unique related games across all at-risk games"
    )
    print(f"Games with at least one relationship: {len(game_relations)}")

    # Phase 3: Fetch platform data for all related games
    print("\n--- Phase 2: Fetching platform data for related games ---")
    related_data = fetch_platforms(list(all_related_ids), headers, timeout)
    print(f"  Platform data retrieved for {len(related_data)} games")

    # Phase 4: Build enrichment records
    print("\n--- Phase 3: Classifying and building enrichment records ---")
    enrichment: List[Dict[str, Any]] = []
    salvaged_count = 0

    for original_game in at_risk:
        gid = original_game["id"]
        rels = game_relations.get(gid, [])
        modern_versions: List[Dict[str, Any]] = []
        any_broadly_available = False

        seen_ids: Set[int] = set()
        for field_name, rid in rels:
            if rid in seen_ids:
                continue
            seen_ids.add(rid)

            related = related_data.get(rid)
            if not related:
                continue  # related game not found in IGDB (possibly removed)

            relation_type = _relation_type_for_field(field_name)
            assessment = assess_risk(related["platforms"])

            broadly_available = assessment["level"] in ("Low", "Minimal")
            if broadly_available:
                any_broadly_available = True

            modern_versions.append(
                {
                    "id": related["id"],
                    "name": related["name"],
                    "relation": relation_type,
                    "platforms": related["platforms"],
                    "risk_level": assessment["level"],
                    "ecosystem_families": assessment["ecosystem_families"],
                    "salvages_original": broadly_available,
                }
            )

        # Sort: broadly available versions first
        modern_versions.sort(key=lambda v: (not v["salvages_original"], v["name"]))

        # Build exclusion reason
        exclusion_reason: Optional[str] = None
        if any_broadly_available:
            salvaged_count += 1
            salvaging = [v for v in modern_versions if v["salvages_original"]]
            if salvaging:
                # Build a concise reason
                names = [v["name"] for v in salvaging]
                if len(names) == 1:
                    exclusion_reason = f"Modern version available: {names[0]}"
                else:
                    exclusion_reason = (
                        f"Modern versions available: {', '.join(names[:3])}"
                    )
                    if len(names) > 3:
                        exclusion_reason += f" (+{len(names) - 3} more)"

        enrichment.append(
            {
                "game_id": gid,
                "game_name": original_game["name"],
                "modern_versions": modern_versions,
                "exclude_from_at_risk": any_broadly_available,
                "exclusion_reason": exclusion_reason,
            }
        )

    print(f"\n  Total at-risk games: {len(at_risk)}")
    print(f"  Games with modern versions found: {len(game_relations)}")
    print(f"  Games salvaged (excluded from at-risk): {salvaged_count}")
    print(
        f"  Games still at risk despite modern versions: {len(game_relations) - salvaged_count}"
    )

    return enrichment


def _relation_type_for_field(field_name: str) -> str:
    """Map IGDB field name to a human-friendly relation type."""
    for fn, rt in RELATIONSHIP_FIELDS:
        if fn == field_name:
            return rt
    return field_name


# ============================================================================
# CLI
# ============================================================================


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Enrich at-risk PS Vita games with modern version data from IGDB.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--client-id", help="IGDB / Twitch Client-ID.")
    parser.add_argument(
        "--client-secret", help="Twitch Client Secret (auto-generates token)."
    )
    parser.add_argument("--token", help="Pre-generated IGDB Bearer Token.")
    parser.add_argument(
        "--input",
        default=None,
        help="Path to the games JSON file. Defaults to ps_vita_games.json in the artifacts dir.",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Path for the enrichment JSON output. Defaults to modern_versions_enrichment.json.",
    )
    parser.add_argument("--timeout", type=float, default=30.0)
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    artifact_dir = Path(__file__).resolve().parent
    project_root = artifact_dir.parent.parent

    _load_dotenv(project_root)
    _load_dotenv(artifact_dir)

    client_id, token = resolve_credentials(args)
    headers = _build_headers(client_id, token)

    input_path = Path(args.input) if args.input else artifact_dir / "ps_vita_games.json"
    output_path = (
        Path(args.output)
        if args.output
        else artifact_dir / "modern_versions_enrichment.json"
    )

    if not output_path.is_absolute():
        output_path = artifact_dir / output_path

    print("=" * 56)
    print("  IGDB Modern Version Enrichment")
    print(f"  Input:  {input_path}")
    print(f"  Output: {output_path}")
    print("=" * 56)

    # 1. Load games
    print(f"\n[1/5] Loading games from {input_path} ...")
    games = load_games(input_path)
    print(f"  Loaded {len(games)} games")

    # 2. Identify at-risk games (Critical + High)
    print("\n[2/5] Identifying at-risk games ...")
    at_risk = identify_at_risk_games(games)
    print(f"  Critical + High risk games: {len(at_risk)}")

    if not at_risk:
        print("\nNo at-risk games found. Nothing to enrich.\n")
        return

    # 3-4. Fetch relationships and platform data, classify
    print("\n[3/5] Fetching relationships and platform data from IGDB ...")
    enrichment = enrich_at_risk_games(at_risk, headers, args.timeout)

    # 5. Write output
    print(f"\n[4/5] Building enrichment index ...")
    # Convert to a lookup by game_id for easy merging
    by_id: Dict[int, Dict[str, Any]] = {}
    for entry in enrichment:
        by_id[entry["game_id"]] = {
            "modern_versions": entry["modern_versions"],
            "exclude_from_at_risk": entry["exclude_from_at_risk"],
            "exclusion_reason": entry["exclusion_reason"],
        }

    print(f"\n[5/5] Writing {len(enrichment)} enrichment records to {output_path} ...")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "metadata": {
                    "source": "IGDB API v4",
                    "description": (
                        "Modern version enrichment for at-risk PS Vita games. "
                        "Maps game IDs to discovered remakes/remasters/ports."
                    ),
                    "total_games_enriched": len(enrichment),
                    "games_salvaged": sum(
                        1 for e in enrichment if e["exclude_from_at_risk"]
                    ),
                },
                "enrichment": by_id,
            },
            f,
            indent=2,
            ensure_ascii=False,
        )

    print(f"\nDone!\n")

    # Quick summary
    salvaged = sum(1 for e in enrichment if e["exclude_from_at_risk"])
    if salvaged > 0:
        print(f"  {salvaged} games were salvaged by widely available modern versions.")
        print(f"  These can be filtered out of the at-risk report.")
    else:
        print("  No games were salvaged by modern versions.")


if __name__ == "__main__":
    main()
