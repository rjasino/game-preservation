# Implementation Plan: User Authentication System

**Branch**: `002-user-auth-system` | **Date**: 2026-07-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-user-auth-system/spec.md`

## Summary

Implement a complete authentication and authorization system for Game Ako
Chronicles using NextAuth.js v5 (Auth.js). Supports email/password registration
with email verification, Google OAuth login, role-based access control
(admin vs author), session management with MongoDB-backed sessions, password
reset flow, account management, rate limiting, and pre-seeded admin account.

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode)

**Primary Dependencies**: Next.js 16 (App Router), NextAuth.js v5 (Auth.js),
@auth/mongodb-adapter, bcryptjs, Mongoose 8

**Storage**: MongoDB via Mongoose ODM — Auth.js adapter creates and manages
collections (users, accounts, sessions, verification_tokens)

**Testing**: Vitest 4 with Node.js environment. Unit tests for password
validation, token generation, role checks. Integration tests for auth flows
via server actions and API routes.

**Target Platform**: Web (Next.js App Router with Server Components)

**Project Type**: web-application

**Performance Goals**: Login response < 500ms (excluding network). Session
validation < 50ms per request. Token generation < 100ms.

**Constraints**: Constitution v1.1.0 — auth MUST support email/password +
Google OAuth (Principle V). Tests MUST achieve >=80% coverage on critical
paths (Principle II). App lives under apps/game-ako/ (Project Structure).

**Scale/Scope**: Two user roles (admin, author). Single admin pre-seeded.
Rate limiting per IP in-memory.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Code Quality & Type Safety | ✅ | TypeScript strict mode. Zod validation schemas for all auth inputs. ESLint configured. Named exports preferred. |
| II. Testing-First Discipline | ✅ | Unit tests for password rules, token logic, role guards. Integration tests for register/login/reset flows. Target >=80% branch coverage on auth paths. |
| III. User Experience Consistency | ✅ | TailwindCSS 4 styled auth pages (login, register, reset). Loading/error/empty states per Principle III. WCAG 2.1 AA on all auth forms. |
| IV. Performance by Default | ✅ | Server Components for auth pages. bcryptjs cost factor 12 keeps hashing under 500ms. Session cookie (no localStorage) avoids client-side overhead. |
| V. Security & Data Integrity | ✅ | Email/password + Google OAuth supported. Passwords hashed with bcryptjs. Secrets via env vars. CSRF via Auth.js. Rate limiting. HTTP-only session cookies. No passwords in logs. |

**Gate Result**: PASS. All five principles satisfied. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-user-auth-system/
├── plan.md              # This file
├── research.md          # Phase 0 — auth library, hashing, sessions, seeding
├── data-model.md        # Phase 1 — User, Account, Session, VerificationToken
├── quickstart.md        # Phase 1 — validation scenarios
└── contracts/
    └── auth-api.md      # Phase 1 — API contracts for all auth endpoints
```

### Source Code (apps/game-ako/)

```text
apps/game-ako/
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/route.ts  # Auth.js route handler
│   │   ├── api/auth/signup/route.ts          # Registration endpoint
│   │   ├── api/user/profile/route.ts         # Profile update
│   │   ├── api/user/account/route.ts         # Account deletion
│   │   ├── (auth)/login/page.tsx             # Login page
│   │   ├── (auth)/register/page.tsx          # Registration page
│   │   ├── (auth)/forgot-password/page.tsx   # Password reset request
│   │   ├── (auth)/reset-password/page.tsx    # Password reset confirm
│   │   ├── admin/page.tsx                    # Admin dashboard
│   │   └── author/page.tsx                   # Author dashboard
│   ├── lib/
│   │   ├── auth.ts           # Auth.js configuration
│   │   ├── auth.config.ts    # Auth.js route config export
│   │   ├── validations.ts    # Zod schemas for auth inputs
│   │   ├── rate-limiter.ts   # In-memory rate limiter
│   │   └── role.ts           # Role check utility
│   └── middleware.ts          # Auth + role enforcement middleware
├── scripts/
│   └── seed-admin.ts         # Admin account seeding script
└── tests/
    ├── auth/
    │   ├── register.test.ts     # Registration flow tests
    │   ├── login.test.ts        # Login flow tests
    │   ├── roles.test.ts        # Role enforcement tests
    │   └── security.test.ts     # Password hashing, rate limiting, CSRF
    └── setup.ts                 # Test DB setup/teardown
```

**Structure Decision**: Auth pages use route groups `(auth)` for shared layout.
Admin/author dashboards are separate route segments with middleware protection.
Tests are co-located under `tests/auth/` for integration tests; unit tests for
pure functions (validations, role checks) live alongside source files.

## Complexity Tracking

> No violations. All constitution gates pass without justification needed.
