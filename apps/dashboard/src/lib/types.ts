export interface GameRelease {
  date: string;
  region: string;
  status: string;
}

export interface Game {
  id: number;
  name: string;
  slug: string;
  url: string;
  summary: string;
  first_release_date: number;
  rating: number | null;
  rating_count: number | null;
  cover_url: string;
  genres: string[];
  themes: string[];
  game_modes: string[];
  platforms: string[];
  /**
   * IGDB category:
   *   0 = main_game, 1 = dlc_addon, 2 = expansion,
   *   3 = bundle, 4 = standalone_expansion, …
   *   null when the field was not present in the source data.
   */
  category: number | null;
  developers: string[];
  publishers: string[];
  /** Whether this game entry is a variant/re-release of another game. */
  is_version: boolean;
  /** Human-readable label for the variant (e.g., "Special Edition"). */
  version_title: string;
  /**
   * Best-effort classification of physical vs digital release:
   *   "physical_and_digital" | "digital_likely" | "unknown"
   */
  release_formats: string;
  releases: GameRelease[];
  /**
   * Optional enrichment data from the modern-version analysis.
   * Only present when enrichment data has been loaded and merged.
   */
  modern_versions?: ModernVersion[];
  exclude_from_at_risk?: boolean;
  exclusion_reason?: string | null;
}

export interface ModernVersion {
  /** IGDB game id of the related game. */
  id: number;
  name: string;
  /** Type of relationship: "remake" | "remaster" | "port" | "expanded" */
  relation: "remake" | "remaster" | "port" | "expanded";
  platforms: string[];
  risk_level: EndangermentLevel;
  ecosystem_families: EcosystemFamily[];
  /** True if this version is widely available and salvages the original. */
  salvages_original: boolean;
}

/**
 * Per-game enrichment data produced by the modern-version analysis.
 */
export interface GameEnrichment {
  modern_versions: ModernVersion[];
  exclude_from_at_risk: boolean;
  exclusion_reason: string | null;
}

/**
 * The full enrichment data file structure.
 */
export interface EnrichmentData {
  metadata: {
    source: string;
    description: string;
    total_games_enriched: number;
    games_salvaged: number;
  };
  enrichment: Record<number, GameEnrichment>;
}

export interface GamesData {
  metadata: {
    source: string;
    query: string;
    mode: string;
    total: number;
  };
  games: Game[];
}

// ---------------------------------------------------------------------------
// Preservation Risk Report Types
// ---------------------------------------------------------------------------

/**
 * Risk level determined by platform ecosystem lock-in.
 * Ordered from most to least endangered.
 */
export type EndangermentLevel =
  | "Critical"
  | "High"
  | "Medium"
  | "Low"
  | "Minimal";

/**
 * Top-level platform ecosystem families used for classification.
 */
export type EcosystemFamily =
  | "Sony"
  | "PC"
  | "Nintendo"
  | "Xbox"
  | "Mobile"
  | "Web"
  | "Other";

/**
 * The result of running the endangerment assessment on a single game.
 */
export interface EndangermentAssessment {
  /** Numeric score from 0–100 (higher = more endangered). */
  score: number;
  /** Human-readable risk level. */
  level: EndangermentLevel;
  /** Short, auditable reasons explaining the assigned level. */
  reasons: string[];
  /** Which ecosystem families the game's platforms belong to. */
  ecosystemFamilies: EcosystemFamily[];
  /**
   * Whether a widely-available modern remaster/remake/port salvages this
   * game from its original risk level. When true, the game can be filtered
   * out of at-risk reports.
   */
  salvagedByModernVersion: boolean;
  /**
   * Human-readable explanation when salvagedByModernVersion is true.
   */
  salvageReason: string | null;
}

/**
 * A game record enriched with its computed preservation risk data.
 */
export interface EnrichedGame extends Game {
  endangerment: EndangermentAssessment;
  /** True when the game is in at least one user-created list. */
  saved: boolean;
  /** IDs of all lists this game belongs to. */
  listIds: number[];
}

// ---------------------------------------------------------------------------
// List Types
// ---------------------------------------------------------------------------

/** Lightweight list info passed from server to client components. */
export interface GameListInfo {
  id: number;
  name: string;
  color: string;
  gameCount: number;
}

// ---------------------------------------------------------------------------
// Filter & Sort Types
// ---------------------------------------------------------------------------

export interface GameFilters {
  genre?: string;
  platform?: string;
  contentType?: string;
  developer?: string;
  publisher?: string;
}

export type SortField = "title" | "release_date" | "risk_score";
export type SortOrder = "asc" | "desc";

export interface GameSort {
  field: SortField;
  order: SortOrder;
}
