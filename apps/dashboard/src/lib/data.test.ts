import { describe, it, expect } from "vitest";
import { normalizeForSearch } from "@/lib/data";

describe("normalizeForSearch", () => {
  it("lowercases the input", () => {
    expect(normalizeForSearch("SHINOBIDO")).toBe("shinobido");
  });

  it("strips colons so exact-title search still matches", () => {
    // The key fix: "Shinobido 2 Revenge of Zen" should match
    // "Shinobido 2: Revenge of Zen"
    const source = normalizeForSearch("Shinobido 2: Revenge of Zen");
    const query = normalizeForSearch("Shinobido 2 Revenge of Zen");
    expect(source).toBe("shinobido 2 revenge of zen");
    expect(query).toBe("shinobido 2 revenge of zen");
    expect(source).toBe(query);
  });

  it("strips dashes, hyphens, and forward slashes", () => {
    expect(normalizeForSearch("Spider-Man 2")).toBe("spiderman 2");
    expect(normalizeForSearch("Final Fantasy X/X-2")).toBe("final fantasy xx2");
  });

  it("strips apostrophes and quotes", () => {
    expect(normalizeForSearch("Assassin's Creed")).toBe("assassins creed");
    expect(normalizeForSearch("Don't Starve")).toBe("dont starve");
  });

  it("strips ampersands and collapses whitespace", () => {
    expect(normalizeForSearch("Dungeons & Dragons")).toBe(
      "dungeons dragons"
    );
  });

  it("strips parentheses and brackets", () => {
    expect(normalizeForSearch("God of War (2018)")).toBe("god of war 2018");
    expect(normalizeForSearch("Nier: Automata [PS4]")).toBe(
      "nier automata ps4"
    );
  });

  it("strips exclamation marks", () => {
    expect(normalizeForSearch("Metal Gear!")).toBe("metal gear");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeForSearch("  Hello   World  ")).toBe("hello world");
  });

  it("handles mixed punctuation", () => {
    const result = normalizeForSearch(
      "Shinobido 2: Revenge of Zen - Director's Cut (2012)"
    );
    expect(result).toBe("shinobido 2 revenge of zen directors cut 2012");
  });

  it("returns empty string for punctuation-only input", () => {
    expect(normalizeForSearch(":-.,!")).toBe("");
  });

  it("preserves digits", () => {
    expect(normalizeForSearch("Persona 4 Golden")).toBe("persona 4 golden");
  });
});
