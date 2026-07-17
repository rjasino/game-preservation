import { describe, it, expect } from "vitest";
import { loginSchema } from "../../src/lib/validations";

describe("Login Validation", () => {
  describe("loginSchema", () => {
    it("accepts valid login input", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "anypassword",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      expect(
        loginSchema.safeParse({ email: "bad", password: "any" }).success
      ).toBe(false);
    });

    it("rejects empty password", () => {
      expect(
        loginSchema.safeParse({ email: "a@b.com", password: "" }).success
      ).toBe(false);
    });

    it("lowercases email", () => {
      const result = loginSchema.safeParse({
        email: "TEST@EXAMPLE.COM",
        password: "any",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.email).toBe("test@example.com");
    });
  });
});
