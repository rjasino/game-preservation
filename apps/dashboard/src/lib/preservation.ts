import type {
  EcosystemFamily,
  EndangermentAssessment,
  EndangermentLevel,
  Game,
} from "./types";

// ---------------------------------------------------------------------------
// Platform Family Mapping
// ---------------------------------------------------------------------------

/**
 * Maps raw IGDB platform name strings to their ecosystem family.
 * Uses case-insensitive substring matching to handle variations.
 */
const PLATFORM_FAMILY_RULES: [EcosystemFamily, string[]][] = [
  [
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
  ],
  [
    "PC",
    [
      "PC (Microsoft Windows)",
      "Windows",
      "Mac",
      "Linux",
    ],
  ],
  [
    "Nintendo",
    [
      "Nintendo Switch",
      "Nintendo 3DS",
      "Nintendo Wii U",
      "Nintendo Wii",
      "Nintendo DS",
      "Nintendo DSi",
      "Nintendo GameCube",
    ],
  ],
  [
    "Xbox",
    [
      "Xbox Series X|S",
      "Xbox One",
      "Xbox 360",
      "Xbox",
    ],
  ],
  [
    "Mobile",
    [
      "iOS",
      "Android",
    ],
  ],
  [
    "Web",
    [
      "Web browser",
      "Browser",
    ],
  ],
];

/**
 * Determine which ecosystem family a single raw platform name belongs to.
 * Falls back to "Other" when no rule matches.
 */
export function classifyPlatform(rawPlatform: string): EcosystemFamily {
  const lower = rawPlatform.toLowerCase();

  for (const [family, keywords] of PLATFORM_FAMILY_RULES) {
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return family;
      }
    }
  }

  return "Other";
}

/**
 * Classify all of a game's platforms into their ecosystem families,
 * returning the deduplicated set.
 */
export function classifyEcosystemFamilies(platforms: string[]): EcosystemFamily[] {
  const families = new Set<EcosystemFamily>();

  for (const platform of platforms) {
    families.add(classifyPlatform(platform));
  }

  return Array.from(families);
}

// ---------------------------------------------------------------------------
// Scoring Engine
// ---------------------------------------------------------------------------

interface ScoredResult {
  score: number;
  level: EndangermentLevel;
  reasons: string[];
}

/**
 * Assess the preservation endangerment of a game based on its platform
 * ecosystem lock-in.  This is a deterministic, rule-based model — no AI.
 */
export function assessEndangerment(game: Game): EndangermentAssessment {
  const { platforms } = game;

  // Edge case: no platforms → treat as Medium (unknown risk)
  if (!platforms || platforms.length === 0) {
    return {
      score: 60,
      level: "Medium",
      reasons: ["No platform data available"],
      ecosystemFamilies: [],
    };
  }

  const families = classifyEcosystemFamilies(platforms);
  const familySet = new Set(families);
  const hasPc = familySet.has("PC");
  const hasMobile = familySet.has("Mobile");
  const hasWeb = familySet.has("Web");
  const hasOpenEcosystem = hasPc || hasMobile || hasWeb;
  const isSonyOnly =
    familySet.size === 1 && familySet.has("Sony");

  // ---- Critical: only on PlayStation Vita -------------------------------
  if (platforms.length === 1 && classifyPlatform(platforms[0]) === "Sony") {
    // Check if it's specifically Vita-only
    const vitaOnly = platforms.every((p) =>
      p.toLowerCase().includes("vita")
    );

    if (vitaOnly) {
      return {
        score: 100,
        level: "Critical",
        reasons: ["Only released on PlayStation Vita"],
        ecosystemFamilies: families,
      };
    }
  }

  // ---- High: locked to Sony ecosystem only ------------------------------
  if (isSonyOnly) {
    return {
      score: 80,
      level: "High",
      reasons: ["Locked to Sony platforms"],
      ecosystemFamilies: families,
    };
  }

  // ---- Medium: closed ecosystems, no PC / Web / Mobile ------------------
  if (!hasOpenEcosystem) {
    return {
      score: 60,
      level: "Medium",
      reasons: [
        "No PC, web, or mobile release found",
        `Locked to ${families.join("/")} platforms`,
      ],
      ecosystemFamilies: families,
    };
  }

  // ---- Minimal: broadly distributed across several ecosystem families ---
  // "Broadly distributed" = 3+ ecosystem families AND has an open ecosystem
  const familyCount = familySet.size;

  if (familyCount >= 3 && hasOpenEcosystem) {
    return {
      score: 10,
      level: "Minimal",
      reasons: [
        `Available across ${familyCount} platform families (${families.join(", ")})`,
        "Preservation risk is low due to wide availability",
      ],
      ecosystemFamilies: families,
    };
  }

  // ---- Low: has PC / Web / Mobile availability --------------------------
  const openFamilies: string[] = [];
  if (hasPc) openFamilies.push("PC");
  if (hasMobile) openFamilies.push("mobile");
  if (hasWeb) openFamilies.push("web");

  return {
    score: 30,
    level: "Low",
    reasons: [
      `Available on ${openFamilies.join(", ")}, so preservation risk is lower`,
    ],
    ecosystemFamilies: families,
  };
}

/**
 * Create a human-readable label for a risk level suitable for display.
 */
export function getRiskLevelLabel(level: EndangermentLevel): string {
  return level;
}

/**
 * Color classes for each risk level (Tailwind-compatible).
 * Returns CSS class strings for badge background, text, and ring.
 */
export function getRiskLevelColors(level: EndangermentLevel): {
  bg: string;
  text: string;
  ring: string;
} {
  switch (level) {
    case "Critical":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        ring: "ring-red-700/10",
      };
    case "High":
      return {
        bg: "bg-orange-50",
        text: "text-orange-700",
        ring: "ring-orange-700/10",
      };
    case "Medium":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        ring: "ring-amber-700/10",
      };
    case "Low":
      return {
        bg: "bg-green-50",
        text: "text-green-700",
        ring: "ring-green-700/10",
      };
    case "Minimal":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        ring: "ring-blue-700/10",
      };
  }
}

/**
 * Order of risk levels from most to least endangered.
 */
export const RISK_LEVEL_ORDER: EndangermentLevel[] = [
  "Critical",
  "High",
  "Medium",
  "Low",
  "Minimal",
];
