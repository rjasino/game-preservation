# Research: App Scaffolding & Health Check

**Feature**: 001-app-scaffold
**Date**: 2026-07-16

## 1. TailwindCSS 4 + Next.js 16 Setup

**Decision**: Use CSS-driven TailwindCSS 4 (no JavaScript config file).

**Rationale**: TailwindCSS 4 eliminates `tailwind.config.js` in favor of
CSS-first configuration. This is the official direction and reduces config
surface area.

**Packages required**:
- `tailwindcss` (^4.0)
- `@tailwindcss/postcss` (^4.0)

**PostCSS config** (`postcss.config.mjs`):
```js
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

**CSS entry** (`src/app/globals.css`):
```css
@import "tailwindcss";
```

**Alternatives considered**:
- TailwindCSS 3 with `tailwind.config.js` — rejected: v4 is the current stable
  release and is specified in the project constitution.
- CSS Modules — rejected: constitution mandates TailwindCSS as the sole styling
  mechanism.

## 2. ESLint 9 Flat Config for Next.js + TypeScript

**Decision**: Use `eslint.config.mjs` flat config format with
`eslint-config-next`.

**Rationale**: ESLint 9 deprecated `.eslintrc` in favor of flat config. Next.js
16 ships with `eslint-config-next` that provides flat config exports.

**Config structure** (`eslint.config.mjs`):
```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  ...compat.extends("next/typescript"),
];

export default eslintConfig;
```

**Alternatives considered**:
- `.eslintrc.json` legacy format — rejected: ESLint 9 flat config is the
  current standard.
- Custom ESLint config from scratch — rejected: `eslint-config-next` provides
  battle-tested rules for Next.js + React + TypeScript.

## 3. Vitest 4 + Next.js Setup

**Decision**: Use Vitest 4 with `@vitejs/plugin-react` and Node.js environment
for unit/integration tests. Server Components are not testable via Vitest
(use Playwright for full-page E2E tests).

**Rationale**: Vitest provides fast, Vite-native testing. The project
constitution mandates it. Node.js environment is appropriate for business
logic, data transforms, and API-level tests.

**Config structure** (`vitest.config.ts`):
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
```

**Package dependencies**:
- `vitest` (^4.0)
- `@vitejs/plugin-react` (^6.0)
- `vite-tsconfig-paths` (^5.0) — resolves TypeScript path aliases

**Alternatives considered**:
- Jest — rejected: Vitest is specified in the project constitution and has
  better Vite/Next.js integration.
- jsdom environment for all tests — rejected: Server Components and business
  logic don't need DOM emulation. Component tests that need jsdom can opt in
  per-file with `// @vitest-environment jsdom`.

## 4. Mongoose Connection Pattern for Next.js

**Decision**: Use a cached-connection module pattern with idempotent
`mongoose.connect()`.

**Rationale**: Next.js can hot-reload modules in development, which would create
multiple connections without caching. Mongoose 8+ `connect()` is idempotent
(calling it on an already-open connection is a no-op), but best practice is
still to cache the connection promise.

**Connection pattern** (`src/lib/db.ts`):
- Export an async `connectDB()` function that returns the cached
  `mongoose.Connection`.
- Use `globalThis` to store the cached promise across HMR reloads.
- Use `mongoose.models.X || mongoose.model("X", schema)` to avoid
  model redefinition errors on hot reload.

**Alternatives considered**:
- New connection per request — rejected: wastes resources and can hit
  connection pool limits under load.
- Prisma — rejected: constitution specifies MongoDB with Mongoose ODM.

## 5. Project Scaffolding Command

**Decision**: Use `create-next-app` as the base, then overlay custom
configuration.

**Rationale**: `create-next-app` handles the boilerplate (directory structure,
TypeScript config, basic ESLint). We then customize or replace configs for
TailwindCSS 4, ESLint 9 flat config, Vitest, and Mongoose.

**Base command**: `npx create-next-app@latest --typescript --tailwind --eslint
--app --src-dir --import-alias "@/*" --no-turbopack game-ako`

**Overlays applied after scaffolding**:
1. Replace TailwindCSS config with v4 CSS-driven approach.
2. Replace ESLint config with flat config format.
3. Add Vitest config and dependencies.
4. Add Mongoose dependency and connection module.
5. Add health check script.

**Alternatives considered**:
- Manual directory creation — rejected: `create-next-app` handles many
  edge cases and produces a working baseline.
- Custom Yeoman generator — rejected: overengineered for a single-project
  scaffold.
