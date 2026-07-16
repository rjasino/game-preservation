# Contract: Health Check CLI

**Feature**: 001-app-scaffold
**Date**: 2026-07-16

## Interface

The health check is invoked as a command-line script:

```bash
npm run healthcheck
```

Or directly:

```bash
npx tsx scripts/healthcheck.ts
```

## Input

| Parameter        | Required | Description                                           |
|------------------|----------|-------------------------------------------------------|
| `MONGODB_URI`    | No       | Env var. If set, includes MongoDB connectivity check. |

No CLI arguments are required. All configuration is via environment variables.

## Output

### stdout

A formatted summary table listing each check result:

```
Health Check Results
====================
| Check                    | Result | Duration |
|--------------------------|--------|----------|
| TypeScript Compilation   | PASS   | 1.2s     |
| ESLint Configuration     | PASS   | 0.8s     |
| Vitest Self-Test         | PASS   | 0.5s     |
| TailwindCSS Build        | PASS   | 1.6s     |
| Next.js Dev Server       | PASS   | 3.4s     |
| MongoDB Connection       | SKIP   | -        |
--------------------------|--------|----------|
| Summary: 5/5 passed, 0 failed, 1 skipped   |
| Total time: 7.5s                            |
```

Key:
- **PASS**: Check completed successfully.
- **FAIL**: Check failed; error details follow the table.
- **SKIP**: Check was not executed (optional check with missing prerequisites).

### stderr

Error details for each failed check:

```
FAIL: TypeScript Compilation
  Error: src/app/page.tsx(3,14): error TS2304: Cannot find name 'foo'.
```

### Exit Codes

| Code | Meaning                            |
|------|------------------------------------|
| 0    | All checks passed (or skipped)     |
| 1    | One or more checks failed          |
| 2    | Prerequisites not met (e.g., no `node_modules`) |

## Checks Executed

| Order | Check Name              | Command / Verification              |
|-------|-------------------------|-------------------------------------|
| 1     | TypeScript Compilation  | `npx tsc --noEmit`                  |
| 2     | ESLint Configuration    | `npx eslint src/ --max-warnings 0`  |
| 3     | Vitest Self-Test        | `npx vitest run src/lib/health.test.ts` |
| 4     | TailwindCSS Build       | `npx next build` (verify CSS output exists) |
| 5     | Next.js Dev Server      | Start dev server, GET /, verify 200, stop server |
| 6*    | MongoDB Connection      | Attempt `mongoose.connect(MONGODB_URI)`, verify readyState |


*Check 6 is only executed when `MONGODB_URI` environment variable is set.
