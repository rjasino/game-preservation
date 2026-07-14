import { describe, it, expect } from "vitest";
import {
  classifyPlatform,
  classifyEcosystemFamilies,
  assessEndangerment,
  getRiskLevelColors,
  RISK_LEVEL_ORDER,
} from "./preservation";
import type { Game } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 1,
    name: "Test Game",
    slug: "test-game",
    url: "https://igdb.com/games/test-game",
    summary: "A test game.",
    first_release_date: 1000000000,
    rating: 80,
    rating_count: 10,
    cover_url: "",
    genres: ["Adventure"],
    themes: ["Action"],
    game_modes: ["Single player"],
    platforms: ["PlayStation Vita"],
    category: 0,
    developers: ["Test Dev"],
    publishers: ["Test Pub"],
    releases: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// classifyPlatform
// ---------------------------------------------------------------------------

describe("classifyPlatform", () => {
  it("maps PlayStation Vita to Sony", () => {
    expect(classifyPlatform("PlayStation Vita")).toBe("Sony");
  });

  it("maps PSP to Sony", () => {
    expect(classifyPlatform("PlayStation Portable")).toBe("Sony");
  });

  it("maps PS4 to Sony", () => {
    expect(classifyPlatform("PlayStation 4")).toBe("Sony");
  });

  it("maps PS5 to Sony", () => {
    expect(classifyPlatform("PlayStation 5")).toBe("Sony");
  });

  it("maps PS3 to Sony", () => {
    expect(classifyPlatform("PlayStation 3")).toBe("Sony");
  });

  it("maps Windows PC to PC", () => {
    expect(classifyPlatform("PC (Microsoft Windows)")).toBe("PC");
  });

  it("maps Mac to PC", () => {
    expect(classifyPlatform("Mac")).toBe("PC");
  });

  it("maps Linux to PC", () => {
    expect(classifyPlatform("Linux")).toBe("PC");
  });

  it("maps Nintendo Switch to Nintendo", () => {
    expect(classifyPlatform("Nintendo Switch")).toBe("Nintendo");
  });

  it("maps Nintendo 3DS to Nintendo", () => {
    expect(classifyPlatform("Nintendo 3DS")).toBe("Nintendo");
  });

  it("maps Xbox One to Xbox", () => {
    expect(classifyPlatform("Xbox One")).toBe("Xbox");
  });

  it("maps Xbox Series X|S to Xbox", () => {
    expect(classifyPlatform("Xbox Series X|S")).toBe("Xbox");
  });

  it("maps Xbox 360 to Xbox", () => {
    expect(classifyPlatform("Xbox 360")).toBe("Xbox");
  });

  it("maps iOS to Mobile", () => {
    expect(classifyPlatform("iOS")).toBe("Mobile");
  });

  it("maps Android to Mobile", () => {
    expect(classifyPlatform("Android")).toBe("Mobile");
  });

  it("maps Web browser to Web", () => {
    expect(classifyPlatform("Web browser")).toBe("Web");
  });

  it("falls back to Other for unknown platforms", () => {
    expect(classifyPlatform("Sega Dreamcast")).toBe("Other");
  });

  it("is case-insensitive", () => {
    expect(classifyPlatform("playstation vita")).toBe("Sony");
    expect(classifyPlatform("PC (MICROSOFT WINDOWS)")).toBe("PC");
  });
});

// ---------------------------------------------------------------------------
// classifyEcosystemFamilies
// ---------------------------------------------------------------------------

describe("classifyEcosystemFamilies", () => {
  it("returns a single family for a single platform game", () => {
    const families = classifyEcosystemFamilies(["PlayStation Vita"]);
    expect(families).toEqual(["Sony"]);
  });

  it("returns multiple deduplicated families", () => {
    const families = classifyEcosystemFamilies([
      "PlayStation Vita",
      "PC (Microsoft Windows)",
      "Nintendo Switch",
    ]);
    expect(families.sort()).toEqual(["Nintendo", "PC", "Sony"]);
  });

  it("deduplicates when multiple platforms map to the same family", () => {
    const families = classifyEcosystemFamilies([
      "PlayStation Vita",
      "PlayStation 4",
      "PlayStation 5",
    ]);
    expect(families).toEqual(["Sony"]);
  });

  it("returns empty array for empty platforms", () => {
    const families = classifyEcosystemFamilies([]);
    expect(families).toEqual([]);
  });

  it("includes Other for unrecognized platforms", () => {
    const families = classifyEcosystemFamilies(["Sega Dreamcast"]);
    expect(families).toEqual(["Other"]);
  });
});

// ---------------------------------------------------------------------------
// assessEndangerment
// ---------------------------------------------------------------------------

describe("assessEndangerment", () => {
  // ---- Critical (Vita-only) ----

  it("assigns Critical (100) to a Vita-only game", () => {
    const assessment = assessEndangerment(
      makeGame({ platforms: ["PlayStation Vita"] })
    );
    expect(assessment.level).toBe("Critical");
    expect(assessment.score).toBe(100);
    expect(assessment.reasons).toContain("Only released on PlayStation Vita");
    expect(assessment.ecosystemFamilies).toEqual(["Sony"]);
  });

  it("does NOT assign Critical if the game has multiple platforms even in Sony", () => {
    const assessment = assessEndangerment(
      makeGame({ platforms: ["PlayStation Vita", "PlayStation 4"] })
    );
    expect(assessment.level).not.toBe("Critical");
  });

  // ---- High (Sony-family only) ----

  it("assigns High (80) to a game locked to Sony platforms (Vita + PS4)", () => {
    const assessment = assessEndangerment(
      makeGame({ platforms: ["PlayStation Vita", "PlayStation 4"] })
    );
    expect(assessment.level).toBe("High");
    expect(assessment.score).toBe(80);
    expect(assessment.reasons).toContain("Locked to Sony platforms");
  });

  it("assigns High (80) to a game on all Sony platforms only", () => {
    const assessment = assessEndangerment(
      makeGame({
        platforms: [
          "PlayStation Vita",
          "PlayStation 3",
          "PlayStation 4",
          "PlayStation 5",
        ],
      })
    );
    expect(assessment.level).toBe("High");
    expect(assessment.score).toBe(80);
  });

  it("assigns High to PSP-only game (still a closed Sony ecosystem)", () => {
    // Note: PSP-only = single platform within Sony but NOT Vita, so NOT Critical
    const assessment = assessEndangerment(
      makeGame({ platforms: ["PlayStation Portable"] })
    );
    // This goes to the Sony-only branch
    expect(assessment.level).toBe("High");
    expect(assessment.score).toBe(80);
    expect(assessment.ecosystemFamilies).toEqual(["Sony"]);
  });

  // ---- Medium (closed ecosystems, no PC/Web/Mobile) ----

  it("assigns Medium (60) to a game on Vita + Nintendo platforms only", () => {
    const assessment = assessEndangerment(
      makeGame({
        platforms: ["PlayStation Vita", "Nintendo Switch"],
      })
    );
    expect(assessment.level).toBe("Medium");
    expect(assessment.score).toBe(60);
    expect(assessment.reasons).toContain(
      "No PC, web, or mobile release found"
    );
    expect(assessment.ecosystemFamilies.sort()).toEqual(["Nintendo", "Sony"]);
  });

  it("assigns Medium (60) to a game on Vita + Xbox only", () => {
    const assessment = assessEndangerment(
      makeGame({
        platforms: ["PlayStation Vita", "Xbox One"],
      })
    );
    expect(assessment.level).toBe("Medium");
    expect(assessment.score).toBe(60);
  });

  it("assigns Medium (60) to a game on only Other platform", () => {
    const assessment = assessEndangerment(
      makeGame({ platforms: ["Sega Dreamcast"] })
    );
    expect(assessment.level).toBe("Medium");
    expect(assessment.score).toBe(60);
  });

  // ---- Low (has PC/Web/Mobile) ----

  it("assigns Low (30) to a game also on PC", () => {
    const assessment = assessEndangerment(
      makeGame({
        platforms: ["PlayStation Vita", "PC (Microsoft Windows)"],
      })
    );
    expect(assessment.level).toBe("Low");
    expect(assessment.score).toBe(30);
    expect(assessment.reasons.some((r) => r.includes("PC"))).toBe(true);
  });

  it("assigns Low (30) to a game also on Mobile", () => {
    const assessment = assessEndangerment(
      makeGame({
        platforms: ["PlayStation Vita", "Android"],
      })
    );
    expect(assessment.level).toBe("Low");
    expect(assessment.score).toBe(30);
  });

  it("assigns Low (30) to a game also on Web", () => {
    const assessment = assessEndangerment(
      makeGame({
        platforms: ["PlayStation Vita", "Web browser"],
      })
    );
    expect(assessment.level).toBe("Low");
    expect(assessment.score).toBe(30);
  });

  it("assigns Low (30) to a Vita game on PC but only 2 total families", () => {
    // Vita + PC = Sony + PC = 2 families, open ecosystem → Low, not Minimal
    const assessment = assessEndangerment(
      makeGame({
        platforms: ["PlayStation Vita", "PC (Microsoft Windows)"],
      })
    );
    expect(assessment.level).toBe("Low");
    expect(assessment.score).toBe(30);
    expect(assessment.ecosystemFamilies.sort()).toEqual(["PC", "Sony"]);
  });

  // ---- Minimal (broadly distributed) ----

  it("assigns Minimal (10) to a game widely available across 3+ families", () => {
    const assessment = assessEndangerment(
      makeGame({
        platforms: [
          "PlayStation Vita",
          "PC (Microsoft Windows)",
          "Nintendo Switch",
          "Xbox One",
        ],
      })
    );
    expect(assessment.level).toBe("Minimal");
    expect(assessment.score).toBe(10);
    expect(assessment.reasons.some((r) => r.includes("wide"))).toBe(true);
  });

  it("assigns Minimal (10) to a game on 3 open + closed families", () => {
    const assessment = assessEndangerment(
      makeGame({
        platforms: [
          "PlayStation Vita",
          "PC (Microsoft Windows)",
          "Android",
          "Nintendo Switch",
        ],
      })
    );
    expect(assessment.level).toBe("Minimal");
    expect(assessment.score).toBe(10);
  });

  // ---- Edge cases ----

  it("handles empty platform array gracefully", () => {
    const assessment = assessEndangerment(makeGame({ platforms: [] }));
    expect(assessment.level).toBe("Medium");
    expect(assessment.score).toBe(60);
    expect(assessment.reasons).toContain("No platform data available");
    expect(assessment.ecosystemFamilies).toEqual([]);
  });

  it("preserves reasons as a list of strings", () => {
    const assessment = assessEndangerment(
      makeGame({ platforms: ["PlayStation Vita"] })
    );
    expect(Array.isArray(assessment.reasons)).toBe(true);
    expect(assessment.reasons.length).toBeGreaterThan(0);
    assessment.reasons.forEach((r) => expect(typeof r).toBe("string"));
  });
});

// ---------------------------------------------------------------------------
// getRiskLevelColors
// ---------------------------------------------------------------------------

describe("getRiskLevelColors", () => {
  it("returns colour classes for every risk level", () => {
    const levels = ["Critical", "High", "Medium", "Low", "Minimal"] as const;
    for (const level of levels) {
      const colors = getRiskLevelColors(level);
      expect(colors).toHaveProperty("bg");
      expect(colors).toHaveProperty("text");
      expect(colors).toHaveProperty("ring");
      expect(typeof colors.bg).toBe("string");
      expect(typeof colors.text).toBe("string");
      expect(typeof colors.ring).toBe("string");
    }
  });

  it("returns distinct colours for different levels", () => {
    const critical = getRiskLevelColors("Critical");
    const minimal = getRiskLevelColors("Minimal");
    // Different levels should have different colour classes
    expect(critical.bg).not.toBe(minimal.bg);
    expect(critical.text).not.toBe(minimal.text);
  });
});

// ---------------------------------------------------------------------------
// RISK_LEVEL_ORDER
// ---------------------------------------------------------------------------

describe("RISK_LEVEL_ORDER", () => {
  it("orders from most to least endangered", () => {
    expect(RISK_LEVEL_ORDER).toEqual([
      "Critical",
      "High",
      "Medium",
      "Low",
      "Minimal",
    ]);
  });

  it("contains all five levels", () => {
    expect(RISK_LEVEL_ORDER).toHaveLength(5);
  });
});
