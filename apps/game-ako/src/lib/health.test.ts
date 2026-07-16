import { describe, it, expect } from "vitest";

import {
  runAllChecks,
  type CheckSuite,
} from "../../scripts/healthcheck";

describe("Health Check Runner", () => {
  it(
    "returns a CheckSuite with the correct shape",
    async () => {
      const suite: CheckSuite = await runAllChecks();

      // Structure validation
      expect(suite).toHaveProperty("results");
      expect(suite).toHaveProperty("totalCount");
      expect(suite).toHaveProperty("passCount");
      expect(suite).toHaveProperty("failCount");
      expect(suite).toHaveProperty("allPassed");
      expect(suite).toHaveProperty("totalDurationMs");

      // Sanity checks
      expect(Array.isArray(suite.results)).toBe(true);
      expect(suite.passCount + suite.failCount).toBe(suite.totalCount);
      expect(suite.totalCount).toBeGreaterThan(0);
      expect(suite.allPassed).toBe(suite.failCount === 0);

      // Every result must have the required fields
      for (const result of suite.results) {
        expect(result).toHaveProperty("name");
        expect(result).toHaveProperty("status");
        expect(result).toHaveProperty("durationMs");
        expect(["pass", "fail"]).toContain(result.status);
        expect(typeof result.name).toBe("string");
        expect(result.name.length).toBeGreaterThan(0);
        expect(result.durationMs).toBeGreaterThanOrEqual(0);
        if (result.status === "fail") {
          expect(result).toHaveProperty("message");
          expect(typeof result.message).toBe("string");
        }
      }
    },
    180_000 // 3-minute timeout for full health check
  );
});
