# Implementation Plan: App Scaffolding & Health Check

**Branch**: `001-app-scaffold` | **Date**: 2026-07-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-app-scaffold/spec.md`

## Summary

Initialize the Game Ako Chronicles Next.js application with the full toolchain
required by the project constitution: Next.js 16 (App Router), TypeScript
strict mode, TailwindCSS 4, ESLint 9 flat config, Vitest 4, and Mongoose.
Provide a health check script that validates every toolchain component is
operational before feature development begins.

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode)

**Primary Dependencies**: Next.js 16, React 19, TailwindCSS 4, ESLint 9,
Vitest 4, Mongoose 8

**Storage**: MongoDB via Mongoose ODM (connection module only; no models in
this feature)

**Testing**: Vitest 4 with `@vitejs/plugin-react` and `vite-tsconfig-paths`

**Target Platform**: Web (Next.js App Router with Server Components)

**Project Type**: web-application

**Performance Goals**: N/A for scaffold (toolchain verification only; Lighthouse
targets apply to subsequent features)

**Constraints**: Constitution v1.0.1 — all tooling choices are constitution-
mandated. No alternative frameworks or libraries permitted without amendment.

**Scale/Scope**: Single Next.js application (monolith). Production deployment
configuration out of scope.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Code Quality & Type Safety | ✅ | TypeScript strict mode enabled in `tsconfig.json`. ESLint 9 flat config with `eslint-config-next` core-web-vitals + typescript rules. |
| II. Testing-First Discipline | ✅ | Vitest configured with Node.js environment. Health check includes a Vitest self-test. Trivial smoke test validates the test runner works. |
| III. User Experience Consistency | ✅ | TailwindCSS 4 configured as sole styling mechanism. Minimal landing page renders with Tailwind styles. |
| IV. Performance by Default | ✅ | Server Components by default (App Router). Lighthouse targets deferred to feature specs; scaffold has no runtime performance concerns. |
| V. Security & Data Integrity | ✅ | `.env.local` added to `.gitignore`. MongoDB connection uses env var. No user data handling in scaffold. |

**Gate Result**: PASS. All five principles are satisfied by the scaffold design.
No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-app-scaffold/
├── plan.md              # This file
├── research.md          # Phase 0 output — config decisions
├── data-model.md        # Phase 1 output — CheckResult, CheckSuite entities
├── quickstart.md        # Phase 1 output — developer onboarding guide
└── contracts/
    └── health-check-cli.md  # Phase 1 output — CLI contract
```

### Source Code (repository root)

```text
game-ako/                    # Scaffolded Next.js app root
├── package.json
├── tsconfig.json            # strict: true, path aliases
├── next.config.ts           # Next.js 16 config
├── postcss.config.mjs       # TailwindCSS 4 PostCSS plugin
├── eslint.config.mjs        # ESLint 9 flat config
├── vitest.config.ts         # Vitest 4 configuration
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout with Tailwind globals
│   │   ├── page.tsx         # Landing page (health-checkable)
│   │   └── globals.css      # @import "tailwindcss"
│   └── lib/
│       ├── db.ts            # Mongoose cached connection module
│       └── health.test.ts   # Vitest smoke test
└── scripts/
    └── healthcheck.ts       # CLI health check runner
```

**Structure Decision**: Single Next.js application (Option 1: Single project).
The `game-ako/` directory is the application root. Configuration files live at
the project root per Next.js conventions. Source code under `src/` with App
Router structure.

## Complexity Tracking

> No violations. All constitution gates pass without justification needed.
