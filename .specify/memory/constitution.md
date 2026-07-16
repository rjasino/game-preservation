<!--
  Sync Impact Report
  ==================
  Version change: [TEMPLATE] → 1.0.0 → 1.0.1 → 1.1.0 (this amendment)
  v1.0.1 changes:
    - PATCH: Clarified prescriptive language (test runner wording).
    - Noted: apps/dashboard is a reference project; constitution governs the
      new app being built, not the reference code.
  v1.1.0 changes (MINOR):
    - Added: Project Structure section — all application code MUST live under
      `apps/<app-name>/`. Constraints: TypeScript Next.js apps only in apps/.
    - Migration note: `game-ako/` scaffold must be relocated to `apps/game-ako/`.
  Added sections:
    - Core Principles (5): Code Quality & Type Safety, Testing-First Discipline,
      User Experience Consistency, Performance by Default, Security & Data Integrity
    - Technical Standards (tech stack constraints)
    - Project Structure (directory conventions)
    - Development Workflow (quality gates & review)
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md       ✅ compatible
    - .specify/templates/spec-template.md        ✅ compatible
    - .specify/templates/tasks-template.md       ✅ compatible (path conventions
                                                   already document `apps/` layout)
    - .specify/templates/commands/               N/A
  Follow-up TODOs:
    - Migrate `game-ako/` → `apps/game-ako/` (tracked in the scaffold feature plan)
-->
# Game Ako Chronicles Constitution

## Core Principles

### I. Code Quality & Type Safety

All production code MUST be written in TypeScript with strict mode enabled.
Functions and methods MUST declare explicit return types. The `any` type is
prohibited unless accompanied by a `// TODO: tighten type` comment justifying
why a narrower type is infeasible at that moment.

- **Single Responsibility**: Each module or file MUST serve one well-defined
  purpose. Organize by feature or domain, never by technical layer alone.
- **Linting Gate**: ESLint with `eslint-config-next` (core-web-vitals +
  typescript rules) MUST pass with zero warnings before any merge.
- **Named Exports**: Prefer named exports over default exports to enable
  reliable IDE auto-import and tree-shaking.
- **No Dead Code**: Remove commented-out blocks and unused imports before
  merging. The commit diff MUST not contain code that is unreachable from the
  application entry point.

### II. Testing-First Discipline

Testing is NON-NEGOTIABLE. Every pull request that adds or changes business
logic MUST include corresponding tests that pass before the PR is merged.

- **Test Runner**: Vitest is the project standard. The configuration MUST
  live in a `vitest.config.ts` at the application root.
- **Test Categories**:
  - **Unit tests** for all pure functions in `src/lib/` — classification
    logic, data transforms, validation, and utility helpers.
  - **Integration tests** for API routes, server actions, and database
    interaction layers.
  - **Component tests** for shared UI components that contain interactive logic.
- **Test Location**: Co-locate test files alongside their source files using
  the `*.test.ts` or `*.test.tsx` convention.
- **Red-Green-Refactor**: Write a failing test first, confirm it fails for the
  right reason, then implement the minimum code to make it pass.
- **Coverage Expectation**: Critical business paths (preservation risk scoring,
  platform classification, authentication flows) MUST maintain ≥80% branch
  coverage.

### III. User Experience Consistency

Every user-facing surface MUST deliver a cohesive, accessible, and
predictable experience.

- **Styling**: TailwindCSS 4 is the sole styling mechanism. Custom CSS files
  (`.css`, `.scss`) are prohibited unless the feature is demonstrably
  impossible to achieve with Tailwind utility classes, and the exception is
  documented in the PR description.
- **Responsive Design**: All pages and components MUST be mobile-first.
  Breakpoints follow Tailwind defaults (`sm`, `md`, `lg`, `xl`, `2xl`).
- **State Coverage**: Every async interaction MUST handle four states:
  loading (skeleton or spinner), empty (helpful zero-state message), error
  (user-facing message + retry where applicable), and success (the data).
- **Accessibility**: All pages MUST meet WCAG 2.1 Level AA. This includes
  semantic HTML, focus management, sufficient color contrast, and `aria-*`
  attributes on interactive elements that lack visible text labels.
- **Navigation Consistency**: Shared layout shell (header, navigation, footer)
  MUST behave identically across all routes. No page-specific layout overrides
  without written justification.

### IV. Performance by Default

Performance is not an afterthought — it is a design constraint from the
first commit.

- **Server Components First**: Default to React Server Components (RSC).
  Add `'use client'` only when the component requires browser-only APIs
  (event handlers, state, effects, or browser-specific APIs).
- **Image Optimization**: All raster images MUST use the Next.js `<Image>`
  component with explicit `width` and `height` (or `fill` with a sized
  parent). No raw `<img>` tags.
- **Data Fetching**: API responses that return lists of more than 20 items
  MUST be paginated. Database queries MUST use appropriate indexes for
  filter and sort columns.
- **Bundle Discipline**: A bundle analysis (e.g., `@next/bundle-analyzer`)
  MUST be run before every production deployment. Any new dependency that
  adds more than 20 KB gzipped to the client bundle requires justification.
- **Lighthouse Targets** (production build, simulated Slow 4G):
  - Performance ≥ 90
  - Accessibility ≥ 95
  - Best Practices ≥ 90
  - SEO ≥ 90

### V. Security & Data Integrity

User data and system integrity are paramount.

- **Authentication**: All routes that access user-specific data or perform
  mutations MUST be protected by authentication. The auth system MUST support
  email/password and Google OAuth at minimum.
- **Input Validation**: Every server action and API route MUST validate and
  sanitize incoming data before processing. Use Zod or a similar schema
  validation library; never trust raw request bodies.
- **Secrets Management**: API keys, database credentials, and OAuth secrets
  MUST be stored in environment variables (`.env.local`). These files MUST be
  listed in `.gitignore` and MUST never be committed.
- **Database Safety**: Use parameterized queries or an ORM (Mongoose) to
  prevent injection attacks. Never concatenate user input into raw query
  strings.
- **Least Privilege**: Each deployment environment (development, preview,
  production) MUST use separate credentials with the minimum permissions
  required for that environment.

## Technical Standards

The project MUST adhere to the following technology stack. Deviation requires
a written proposal approved through the amendment process.

| Layer              | Technology                          |
| ------------------ | ----------------------------------- |
| **Framework**      | Next.js (App Router)                |
| **Language**       | TypeScript 5+ (strict mode)         |
| **Database**       | MongoDB with Mongoose ODM           |
| **Authentication** | Email/password + Google OAuth       |
| **Styling**        | TailwindCSS 4                       |
| **Testing**        | Vitest                              |
| **Linting**        | ESLint 9 + eslint-config-next       |
| **Package Manager**| npm                                 |

> **Note**: The Python IGDB fetcher under `.asd/artifacts/` is a data-ingestion
> utility and is exempt from TypeScript and Next.js constraints documented above.
> Its own code-quality expectations are documented in the script header.

## Project Structure

All application source code for the Game Ako Chronicles project MUST reside
under the `apps/` directory at the repository root. Each application occupies
its own subdirectory named after the app: `apps/<app-name>/`.

```
apps/
├── <app-name>/          # One app per subdirectory
│   ├── package.json     # App-specific dependencies and scripts
│   ├── tsconfig.json    # TypeScript config (strict mode)
│   ├── next.config.ts   # Next.js configuration
│   ├── vitest.config.ts # Test runner configuration
│   ├── eslint.config.mjs
│   ├── postcss.config.mjs
│   └── src/             # Application source
└── dashboard/           # Reference app (not the app being built)
```

**Rules**:

- Every application subdirectory under `apps/` MUST be a self-contained
  Next.js project with its own `package.json`, `tsconfig.json`, and
  configuration files.
- Shared code (types, utilities, database models) that spans multiple apps
  MUST be extracted into a shared package under `packages/` — no
  cross-app relative imports.
- The `apps/dashboard/` directory is a reference project studied during
  development; it is NOT the application being built and is exempt from the
  constitution's quality gates.
- Spec and planning artifacts live under `specs/` at the repository root,
  outside the `apps/` tree.
- Data ingestion scripts (Python) live under `.asd/artifacts/` and are
  exempt from TypeScript and Next.js constraints.

## Development Workflow

- **Branching**: Feature branches MUST branch from `main` and use the naming
  convention `###-feature-name` where `###` is the feature spec number.
- **Pull Requests**: Every PR MUST:
  - Pass linting (`npm run lint`) with zero warnings.
  - Pass all tests (`npm run test`).
  - Build successfully (`npm run build`).
  - Include a description referencing the relevant spec document.
- **Code Review**: At least one approving review is required before merge.
  Reviewers MUST verify compliance with this constitution.
- **Commit Hygiene**: Commits SHOULD be small, focused, and use present-tense
  imperative messages (e.g., "Add pagination to game list" not "Added
  pagination").

## Governance

This constitution supersedes all other development practices and conventions
for the Game Ako Chronicles project. Any conflict between this document and
other guidance (READMEs, wiki pages, informal conventions) MUST be resolved in
favor of this constitution.

- **Amendment Process**: Proposed changes MUST be documented in a pull request
  that updates this file. Amendments require approval from the project
  maintainer and MUST include a migration plan for any affected code or
  workflows.
- **Versioning**: This document follows Semantic Versioning:
  - **MAJOR**: Removal or redefinition of a core principle.
  - **MINOR**: New principle or section added; material expansion of guidance.
  - **PATCH**: Clarifications, wording improvements, typo fixes.
- **Compliance Review**: Every feature spec and implementation plan MUST
  include a Constitution Check section verifying alignment with each principle.
  Violations that cannot be resolved MUST be explicitly justified in the plan
  with a documented simpler alternative that was rejected and why.

**Version**: 1.1.0 | **Ratified**: 2026-07-16 | **Last Amended**: 2026-07-16
