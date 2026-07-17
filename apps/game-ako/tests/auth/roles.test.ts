import { describe, it, expect } from "vitest";
import { isAdmin, isAuthor } from "../../src/lib/role-check";

describe("Role Utilities", () => {
  describe("isAdmin", () => {
    it("returns true for admin", () => {
      expect(isAdmin("admin")).toBe(true);
    });
    it("returns false for author", () => {
      expect(isAdmin("author")).toBe(false);
    });
    it("returns false for undefined", () => {
      expect(isAdmin(undefined)).toBe(false);
    });
  });

  describe("isAuthor", () => {
    it("returns true for author", () => {
      expect(isAuthor("author")).toBe(true);
    });
    it("returns false for admin", () => {
      expect(isAuthor("admin")).toBe(false);
    });
    it("returns false for undefined", () => {
      expect(isAuthor(undefined)).toBe(false);
    });
  });
});
