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

export type GameRow = Pick<Game, "id" | "name" | "cover_url" | "genres"> & {
  platform: string;
};
