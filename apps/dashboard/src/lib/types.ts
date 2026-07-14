export interface GameRelease {
  date: string;
  region: string;
  type: string;
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
  releases: GameRelease[];
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

export interface GameFilters {
  genre?: string;
  platform?: string;
  contentType?: string;
  developer?: string;
  publisher?: string;
}

export type SortField = "title" | "release_date";
export type SortOrder = "asc" | "desc";

export interface GameSort {
  field: SortField;
  order: SortOrder;
}
