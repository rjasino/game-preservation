import { execSync, spawn, type ChildProcess } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Types (matches data-model.md + contracts/health-check-cli.md)
// ---------------------------------------------------------------------------

export type CheckStatus = "pass" | "fail";

export interface CheckResult {
  name: string;
  status: CheckStatus;
  message: string | null;
  durationMs: number;
}

export interface CheckSuite {
  results: CheckResult[];
  totalCount: number;
  passCount: number;
  failCount: number;
  allPassed: boolean;
  totalDurationMs: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isWindows = process.platform === "win32";

function hrDuration(start: [number, number]): number {
  const diff = process.hrtime(start);
  return Math.round(diff[0] * 1000 + diff[1] / 1_000_000);
}

function fail(name: string, message: string, start: [number, number]): CheckResult {
  return { name, status: "fail", message, durationMs: hrDuration(start) };
}

function pass(name: string, start: [number, number]): CheckResult {
  return { name, status: "pass", message: null, durationMs: hrDuration(start) };
}

function runCmd(cmd: string, cwd?: string): { ok: boolean; output: string } {
  try {
    const output = execSync(cmd, {
      cwd,
      encoding: "utf-8",
      stdio: "pipe",
      timeout: 90_000,
      shell: isWindows ? "cmd.exe" : "/bin/sh",
    });
    return { ok: true, output };
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    const out = err.stdout ?? "";
    const errOut = err.stderr ?? "";
    return {
      ok: false,
      output: (out + errOut).slice(0, 800) || err.message || "Unknown error",
    };
  }
}

function checkPrerequisites(): CheckResult | null {
  const start = process.hrtime();
  const root = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(root, "..");
  let hasNodeModules = false;
  try {
    require.resolve("next", { paths: [projectRoot] });
    hasNodeModules = true;
  } catch {
    // not found
  }
  if (!hasNodeModules) {
    return fail(
      "Prerequisites",
      "node_modules not found. Run `npm install` first.",
      start
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

async function checkTypeScript(projectRoot: string): Promise<CheckResult> {
  const start = process.hrtime();
  const { ok, output } = runCmd("npx tsc --noEmit", projectRoot);
  return ok
    ? pass("TypeScript Compilation", start)
    : fail("TypeScript Compilation", output, start);
}

async function checkESLint(projectRoot: string): Promise<CheckResult> {
  const start = process.hrtime();
  const { ok, output } = runCmd(
    "npx eslint src/ --max-warnings 0",
    projectRoot
  );
  return ok
    ? pass("ESLint Configuration", start)
    : fail("ESLint Configuration", output, start);
}

async function checkVitest(projectRoot: string): Promise<CheckResult> {
  const start = process.hrtime();
  // Run vitest on a trivial inline test — avoids recursive test issues
  const { ok, output } = runCmd(
    'npx vitest run --config vitest.config.ts --reporter verbose -t "health-check-canary"',
    projectRoot
  );
  return ok
    ? pass("Vitest Self-Test", start)
    : fail("Vitest Self-Test", output, start);
}

async function checkTailwindCSS(projectRoot: string): Promise<CheckResult> {
  const start = process.hrtime();
  const { ok, output } = runCmd("npx next build", projectRoot);
  if (!ok) {
    return fail("TailwindCSS Build", output, start);
  }
  // Verify CSS output exists
  const fs = await import("node:fs");
  const cssDir = path.join(projectRoot, ".next", "static");
  const hasCss = fs.existsSync(cssDir);
  return hasCss
    ? pass("TailwindCSS Build", start)
    : fail(
        "TailwindCSS Build",
        "No CSS output found in .next/static after build.",
        start
      );
}

async function checkNextDevServer(projectRoot: string): Promise<CheckResult> {
  const start = process.hrtime();
  const PORT = 3099;

  return new Promise<CheckResult>((resolve) => {
    const child: ChildProcess = spawn(
      "npx",
      ["next", "dev", "-p", String(PORT)],
      {
        cwd: projectRoot,
        stdio: "pipe",
        shell: isWindows,
        env: { ...process.env, PORT: String(PORT) },
      }
    );

    const timeout = setTimeout(() => {
      child.kill();
      resolve(
        fail(
          "Next.js Dev Server",
          "Timed out waiting for server to start (30s).",
          start
        )
      );
    }, 30_000);

    let started = false;

    child.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      if (!started && (text.includes("Local:") || text.includes("ready"))) {
        started = true;
        setTimeout(() => {
          http
            .get(`http://localhost:${PORT}`, (res) => {
              clearTimeout(timeout);
              child.kill();
              if (res.statusCode === 200) {
                resolve(pass("Next.js Dev Server", start));
              } else {
                resolve(
                  fail(
                    "Next.js Dev Server",
                    `Responded with HTTP ${res.statusCode}.`,
                    start
                  )
                );
              }
            })
            .on("error", (err) => {
              clearTimeout(timeout);
              child.kill();
              resolve(
                fail("Next.js Dev Server", `HTTP error: ${err.message}`, start)
              );
            });
        }, 2000);
      }
    });

    child.stderr?.on("data", (data: Buffer) => {
      const text = data.toString();
      if (!started && text.includes("Error")) {
        clearTimeout(timeout);
        child.kill();
        resolve(fail("Next.js Dev Server", text.slice(0, 500), start));
      }
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      resolve(
        fail("Next.js Dev Server", `Spawn failed: ${err.message}`, start)
      );
    });
  });
}

async function checkMongoDB(): Promise<CheckResult> {
  const start = process.hrtime();
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return {
      name: "MongoDB Connection",
      status: "pass",
      message: "SKIP: MONGODB_URI not set",
      durationMs: hrDuration(start),
    };
  }

  try {
    const mongoose = await import("mongoose");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const ready = mongoose.connection.readyState === 1;
    await mongoose.disconnect();
    return ready
      ? pass("MongoDB Connection", start)
      : fail(
          "MongoDB Connection",
          "Connected but readyState is not 1.",
          start
        );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail("MongoDB Connection", msg.slice(0, 500), start);
  }
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export async function runAllChecks(): Promise<CheckSuite> {
  const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    ".."
  );

  // Prerequisites
  const prereq = checkPrerequisites();
  if (prereq) {
    return {
      results: [prereq],
      totalCount: 1,
      passCount: 0,
      failCount: 1,
      allPassed: false,
      totalDurationMs: prereq.durationMs,
    };
  }

  // Run all checks in sequence
  const results: CheckResult[] = [];
  results.push(await checkTypeScript(projectRoot));
  results.push(await checkESLint(projectRoot));
  results.push(await checkVitest(projectRoot));
  results.push(await checkTailwindCSS(projectRoot));
  results.push(await checkNextDevServer(projectRoot));
  results.push(await checkMongoDB());

  const passCount = results.filter((r) => r.status === "pass").length;
  const failCount = results.filter((r) => r.status === "fail").length;
  const totalDurationMs = results.reduce((sum, r) => sum + r.durationMs, 0);

  return {
    results,
    totalCount: results.length,
    passCount,
    failCount,
    allPassed: failCount === 0,
    totalDurationMs,
  };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function printSummary(suite: CheckSuite): void {
  console.log("\nHealth Check Results");
  console.log("====================");

  const nameCol = 28;
  const statusCol = 8;
  const durCol = 10;

  const sep =
    "|" +
    "-".repeat(nameCol) +
    "|" +
    "-".repeat(statusCol) +
    "|" +
    "-".repeat(durCol) +
    "|";

  console.log(sep);
  console.log(
    `| ${"Check".padEnd(nameCol - 2)}| ${"Result".padEnd(statusCol - 2)}| ${"Duration".padEnd(durCol - 2)}|`
  );
  console.log(sep);

  for (const r of suite.results) {
    const status = r.status.toUpperCase();
    const isSkip = r.message?.startsWith("SKIP:");
    const dur = isSkip ? "-" : `${(r.durationMs / 1000).toFixed(1)}s`;
    console.log(
      `| ${r.name.padEnd(nameCol - 2)}| ${status.padEnd(statusCol - 2)}| ${dur.padEnd(durCol - 2)}|`
    );
  }

  console.log(sep);

  const skipped = suite.results.filter((r) =>
    r.message?.startsWith("SKIP:")
  ).length;
  const executed = suite.totalCount - skipped;
  console.log(
    `| Summary: ${suite.passCount}/${executed} passed, ${suite.failCount} failed${skipped > 0 ? `, ${skipped} skipped` : ""}   |`
  );
  console.log(
    `| Total time: ${(suite.totalDurationMs / 1000).toFixed(1)}s                            |`
  );
  console.log("");

  // Print failure details
  const failures = suite.results.filter((r) => r.status === "fail");
  for (const f of failures) {
    console.error(`\nFAIL: ${f.name}`);
    console.error(`  Error: ${f.message}`);
  }
}

async function main(): Promise<void> {
  const suite = await runAllChecks();
  printSummary(suite);

  // Don't call process.exit inside test runners
  const isTestEnv =
    process.env.VITEST !== undefined || process.env.NODE_ENV === "test";
  if (!isTestEnv) {
    if (suite.allPassed) {
      process.exit(0);
    } else if (
      suite.results.length === 1 &&
      suite.results[0].message?.includes("node_modules")
    ) {
      process.exit(2);
    } else {
      process.exit(1);
    }
  }
}

// Only run CLI when executed directly (not imported)
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("healthcheck.ts") ||
    process.argv[1].endsWith("healthcheck"));

if (isDirectRun) {
  main().catch((err) => {
    console.error("Health check crashed:", err);
    process.exit(1);
  });
}
