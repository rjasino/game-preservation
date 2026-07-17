import { describe, it, expect } from "vitest";
import { profileUpdateSchema } from "../../src/lib/validations";

describe("Account Management Validation", () => {
  describe("profileUpdateSchema", () => {
    it("accepts valid name", () => {
      const result = profileUpdateSchema.safeParse({ name: "Jane Doe" });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      expect(profileUpdateSchema.safeParse({ name: "" }).success).toBe(false);
    });

    it("rejects name too short", () => {
      expect(profileUpdateSchema.safeParse({ name: "J" }).success).toBe(false);
    });

    it("rejects name too long", () => {
      expect(
        profileUpdateSchema.safeParse({ name: "a".repeat(51) }).success
      ).toBe(false);
    });
  });
});
