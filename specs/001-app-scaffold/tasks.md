# Tasks: App Scaffolding & Health Check

**Input**: Design documents from `/specs/001-app-scaffold/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: INCLUDED. The project constitution (Principle II) mandates testing. The
feature spec explicitly requires a Vitest self-test in US2 acceptance scenario 1.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Project root**: `game-ako/` (the scaffolded Next.js application)
- All paths below are relative to the project root unless specified otherwise.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bootstrap the Next.js project and install all required dependencies

- [X] T001 Bootstrap Next.js project with create-next-app in `game-ako/` using flags: `--typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack`
- [X] T002 Install additional dependencies: `mongoose`, `vitest`, `@vitejs/plugin-react`, `vite-tsconfig-paths` in `game-ako/`

---

## Phase 2: Foundational (Configuration Files)

**Purpose**: All configuration files that both user stories depend on. These MUST
be complete before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 [P] Create TailwindCSS 4 PostCSS config in `game-ako/postcss.config.mjs` (plugin: `@tailwindcss/postcss`)
- [X] T004 [P] Create ESLint 9 flat config in `game-ako/eslint.config.mjs` (FlatCompat with `next/core-web-vitals` + `next/typescript`)
- [X] T005 [P] Create Vitest config in `game-ako/vitest.config.ts` (`@vitejs/plugin-react`, `vite-tsconfig-paths`, node environment, include `src/**/*.test.ts` and `src/**/*.test.tsx`)
- [X] T006 [P] Verify TypeScript strict mode in `game-ako/tsconfig.json` (`strict: true`, path aliases `@/*` → `./src/*`)
- [X] T007 [P] Create Next.js config in `game-ako/next.config.ts` (default export, no custom options needed)
- [X] T008 [P] Create Mongoose cached connection module in `game-ako/src/lib/db.ts` (export `connectDB()`, use `globalThis` for HMR-safe caching)
- [X] T009 Create TailwindCSS 4 entry stylesheet in `game-ako/src/app/globals.css` with `@import "tailwindcss"`
- [X] T010 Add npm scripts to `game-ako/package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`, `"healthcheck": "npx tsx scripts/healthcheck.ts"`

**Checkpoint**: All config files exist and dependencies are installed. User story
implementation can now begin.

---

## Phase 3: User Story 1 - Scaffold the Project Skeleton (Priority: P1) 🎯 MVP

**Goal**: Deliver a working Next.js landing page with TailwindCSS styles applied,
proving the scaffold produced a runnable application.

**Independent Test**: Run `npm run dev` in `game-ako/`, open http://localhost:3000,
and confirm a styled landing page renders.

### Implementation for User Story 1

- [X] T011 [US1] Create root layout in `game-ako/src/app/layout.tsx` (import `globals.css`, export metadata with title "Game Ako Chronicles", render children in `<html>` + `<body>` with Tailwind classes)
- [X] T012 [US1] Create landing page in `game-ako/src/app/page.tsx` (renders "Game Ako Chronicles" heading, descriptive subtitle, styled with Tailwind utility classes)

**Checkpoint**: Running `npm run dev` shows a styled landing page at localhost:3000.

---

## Phase 4: User Story 2 - Health Check Verification (Priority: P2)

**Goal**: A single-command health check that validates every toolchain component
is operational and reports a pass/fail summary.

**Independent Test**: Run `npm run healthcheck` in `game-ako/` and confirm all
checks pass with a summary table printed to stdout and exit code 0.

### Tests for User Story 2 ⚠️

> **NOTE: Write this test FIRST, ensure it FAILS before implementing the runner**

- [X] T013 [P] [US2] Create Vitest smoke test in `game-ako/src/lib/health.test.ts` that imports the health check runner, runs it with a mock subset, and verifies the summary structure (pass/fail counts, exit code logic)

### Implementation for User Story 2

- [X] T014 [US2] Create health check runner script in `game-ako/scripts/healthcheck.ts` implementing all checks per `contracts/health-check-cli.md`:
  - TypeScript compilation (`npx tsc --noEmit`)
  - ESLint configuration (`npx eslint src/ --max-warnings 0`)
  - Vitest self-test (`npx vitest run src/lib/health.test.ts`)
  - TailwindCSS build (`npx next build` — verify CSS output)
  - Next.js dev server (start, GET /, verify 200, stop)
  - MongoDB connection (optional, only when `MONGODB_URI` env var is set)
  - Format output as a summary table with pass/fail status and duration per check
  - Return exit code 0 if all pass, 1 if any fail, 2 if prerequisites missing
- [X] T015 [US2] Verify health check integration: run `npm run healthcheck` and confirm all 5 mandatory checks pass, exit code 0, summary table rendered

**Checkpoint**: Health check passes all verifications on a correctly scaffolded project.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [X] T016 Run full end-to-end validation per `quickstart.md` — scaffold → install → healthcheck → dev server
- [X] T017 [P] Verify scaffolded ESLint passes with zero warnings (`npm run lint` in `game-ako/`)
- [X] T018 [P] Verify scaffolded TypeScript compiles with zero errors (`npx tsc --noEmit` in `game-ako/`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion — test T013 can run in parallel with US1
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2). No dependency on US2.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2). Test T013 is independent of US1.
  Runner T014 can be developed in parallel with US1 tasks.

### Within Each Phase

- Phase 2: T003–T008 are all independent (different files) — run in parallel
- Phase 3: T011 before T012 (layout before page is conventional, not required)
- Phase 4: T013 (test) MUST fail before T014 (implementation) per TDD
- Phase 5: All tasks can run in parallel

### Parallel Opportunities

- All Phase 2 config files (T003–T008) can be created simultaneously
- US1 (T011–T012) and US2 test (T013) can run in parallel after Phase 2
- Polish validation tasks (T016–T018) can run in parallel

---

## Parallel Example: Phase 2 Configuration

```bash
# Launch all config files together:
Task: "Create postcss.config.mjs in game-ako/postcss.config.mjs"
Task: "Create eslint.config.mjs in game-ako/eslint.config.mjs"
Task: "Create vitest.config.ts in game-ako/vitest.config.ts"
Task: "Verify tsconfig.json in game-ako/tsconfig.json"
Task: "Create next.config.ts in game-ako/next.config.ts"
Task: "Create db.ts in game-ako/src/lib/db.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T010)
3. Complete Phase 3: User Story 1 (T011–T012)
4. **STOP and VALIDATE**: Run `npm run dev`, confirm landing page renders
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → toolchain ready
2. Add User Story 1 → styled landing page (MVP!)
3. Add User Story 2 → health check validates everything
4. Polish → end-to-end validation complete

### Single Developer Strategy

With one developer working sequentially:

1. T001 → T002 (Setup, ~5 min)
2. T003–T010 (Config files, can parallelize by writing all at once, ~15 min)
3. T011–T012 (App shell, ~5 min)
4. T013 → T014–T015 (Health check, ~20 min)
5. T016–T018 (Validation, ~5 min)

**Estimated total**: ~50 minutes for a single developer.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- The `game-ako/` directory is the scaffolded app root — create it if it does
  not exist
- All `create-next-app` flags are documented in `research.md`
- Health check contract is defined in `contracts/health-check-cli.md`
- Verify tests fail before implementing (T013 → confirm failure → T014)
- Commit after each phase or logical group
- Stop at any checkpoint to validate story independently

