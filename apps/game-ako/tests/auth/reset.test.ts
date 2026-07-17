import { describe, it, expect } from "vitest";
import { resetPasswordSchema } from "../../src/lib/validations";

describe("Password Reset Validation", () => {
  describe("resetPasswordSchema", () => {
    it("accepts valid reset input", () => {
      const result = resetPasswordSchema.safeParse({
        token: "abc123",
        password: "NewPassword1",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty token", () => {
      expect(
        resetPasswordSchema.safeParse({ token: "", password: "Password1" })
          .success
      ).toBe(false);
    });

    it("rejects weak password", () => {
      expect(
        resetPasswordSchema.safeParse({ token: "abc", password: "short" })
          .success
      ).toBe(false);
    });
  });
});
