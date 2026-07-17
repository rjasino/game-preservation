import { describe, it, expect } from "vitest";
import { registerSchema, passwordSchema, emailSchema, displayNameSchema } from "../../src/lib/validations";

describe("Registration Validation", () => {
  describe("emailSchema", () => {
    it("accepts valid emails", () => {
      expect(emailSchema.safeParse("test@example.com").success).toBe(true);
    });

    it("rejects invalid emails", () => {
      expect(emailSchema.safeParse("not-an-email").success).toBe(false);
      expect(emailSchema.safeParse("").success).toBe(false);
    });

    it("lowercases and trims email", () => {
      const result = emailSchema.safeParse("Test@Example.COM");
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe("test@example.com");
    });
  });

  describe("passwordSchema", () => {
    it("accepts valid passwords", () => {
      expect(passwordSchema.safeParse("Password1").success).toBe(true);
      expect(passwordSchema.safeParse("abcdefg1").success).toBe(true);
    });

    it("rejects passwords under 8 characters", () => {
      expect(passwordSchema.safeParse("Ab1").success).toBe(false);
    });

    it("rejects passwords without a letter", () => {
      expect(passwordSchema.safeParse("12345678").success).toBe(false);
    });

    it("rejects passwords without a number", () => {
      expect(passwordSchema.safeParse("abcdefgh").success).toBe(false);
    });
  });

  describe("displayNameSchema", () => {
    it("accepts valid names", () => {
      expect(displayNameSchema.safeParse("Jane Doe").success).toBe(true);
      expect(displayNameSchema.safeParse("Jo").success).toBe(true);
    });

    it("rejects names under 2 characters", () => {
      expect(displayNameSchema.safeParse("J").success).toBe(false);
    });

    it("rejects names over 50 characters", () => {
      expect(displayNameSchema.safeParse("a".repeat(51)).success).toBe(false);
    });

    it("trims whitespace", () => {
      const result = displayNameSchema.safeParse("  Jane Doe  ");
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe("Jane Doe");
    });
  });

  describe("registerSchema", () => {
    it("accepts valid registration input", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        name: "Jane Doe",
        password: "Password1",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing fields", () => {
      expect(registerSchema.safeParse({ email: "a@b.com" }).success).toBe(false);
      expect(registerSchema.safeParse({ name: "Jane" }).success).toBe(false);
    });
  });
});
