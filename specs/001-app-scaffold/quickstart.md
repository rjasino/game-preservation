# Quickstart: App Scaffolding & Health Check

**Feature**: 001-app-scaffold
**Date**: 2026-07-16

## Prerequisites

| Requirement | Version  | How to verify     |
|-------------|----------|-------------------|
| Node.js     | 18+      | `node --version`  |
| npm         | 9+       | `npm --version`   |
| Git         | any      | `git --version`   |

## Scaffolding

### 1. Bootstrap the project

```bash
npx create-next-app@latest game-ako --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
cd game-ako
```

### 2. Apply custom configuration

After bootstrap, overlay the following files (provided in the implementation):

| File                     | Purpose                                  |
|--------------------------|------------------------------------------|
| `postcss.config.mjs`     | TailwindCSS 4 PostCSS plugin             |
| `src/app/globals.css`    | TailwindCSS 4 CSS entry (`@import "tailwindcss"`) |
| `eslint.config.mjs`      | ESLint 9 flat config with Next.js rules  |
| `vitest.config.ts`       | Vitest configuration                     |
| `src/lib/db.ts`          | Mongoose cached connection module        |
| `scripts/healthcheck.ts` | Health check runner                      |
| `src/lib/health.test.ts` | Trivial Vitest smoke test                |

### 3. Install additional dependencies

```bash
npm install mongoose
npm install -D vitest @vitejs/plugin-react vite-tsconfig-paths
```

### 4. Verify the scaffold

```bash
npm run healthcheck
```

**Expected output**:

```
Health Check Results
====================
| Check                    | Result | Duration |
|--------------------------|--------|----------|
| TypeScript Compilation   | PASS   | ~1s      |
| ESLint Configuration     | PASS   | ~1s      |
| Vitest Self-Test         | PASS   | ~1s      |
| TailwindCSS Build        | PASS   | ~2s      |
| Next.js Dev Server       | PASS   | ~3s      |
--------------------------|--------|----------|
| Summary: 5/5 passed, 0 failed, 0 skipped   |
```

### 5. Start development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page should
render with TailwindCSS styles applied.

## Health Check (Standalone)

To verify an existing scaffold (after dependency changes, environment changes,
etc.):

```bash
# Basic health check (no database)
npm run healthcheck

# With MongoDB connectivity check
MONGODB_URI="mongodb://localhost:27017/game-ako" npm run healthcheck
```

## Troubleshooting

| Symptom                              | Likely Cause                    | Fix                                 |
|--------------------------------------|---------------------------------|-------------------------------------|
| `npm run healthcheck` not found      | Health check script not added   | Copy `scripts/healthcheck.ts`       |
| All checks fail with "command not found" | `npm install` not run       | Run `npm install`                   |
| TypeScript errors on scaffolded files | create-next-app version mismatch | Update configs per research.md     |
| TailwindCSS styles not rendering     | PostCSS config missing          | Verify `postcss.config.mjs` exists  |
| Vitest cannot import `@/` paths      | `vite-tsconfig-paths` missing   | Run `npm install -D vite-tsconfig-paths` |
| Next.js port 3000 already in use     | Another process on port 3000    | Kill process or use `npx next dev -p 3001` |
| MongoDB check fails                   | MongoDB not running             | Start MongoDB or omit `MONGODB_URI` |
