# Tasks: User Authentication System

**Input**: Design documents from `/specs/002-user-auth-system/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: INCLUDED. Constitution Principle II mandates testing. Auth is a
security-critical path requiring integration tests for all flows.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **App root**: `apps/game-ako/` (the Next.js application)
- All paths are relative to the app root unless specified otherwise.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure environment for auth system

- [X] T001 Install auth dependencies in `apps/game-ako/`: `next-auth@beta`, `@auth/mongodb-adapter`, `bcryptjs`, `zod`
- [X] T002 [P] Install dev dependencies in `apps/game-ako/`: `@types/bcryptjs`
- [X] T003 Create `.env.local` in `apps/game-ako/` with placeholders for `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AUTH_URL`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core auth infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Create Auth.js configuration in `apps/game-ako/src/lib/auth.config.ts` (providers list, session strategy, pages config, callbacks)
- [X] T005 [P] Create Auth.js route handler export in `apps/game-ako/src/lib/auth.ts` (wraps auth.config with MongoDB adapter)
- [X] T006 [P] Create Zod validation schemas in `apps/game-ako/src/lib/validations.ts` (email, password strength, display name, registration, login, password reset)
- [X] T007 [P] Create role check utility in `apps/game-ako/src/lib/role.ts` (isAdmin, isAuthor, requireRole helpers)
- [X] T008 [P] Create in-memory rate limiter in `apps/game-ako/src/lib/rate-limiter.ts` (sliding window, 5 attempts/15 min, IP-based with X-Forwarded-For support)
- [X] T009 Create Auth.js catch-all route handler in `apps/game-ako/src/app/api/auth/[...nextauth]/route.ts` (exports GET and POST from auth.ts)

**Checkpoint**: Auth.js is configured, MongoDB adapter connected, validation schemas ready.

---

## Phase 3: User Story 1 - Author Registration & Login (Priority: P1) 🎯 MVP

**Goal**: Visitors can register with email/password (or Google OAuth), verify
their email, and log in to access their author dashboard.

**Independent Test**: Register a new account, verify email, log in, confirm
author dashboard is accessible.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T010 [P] [US1] Create registration unit tests in `apps/game-ako/tests/auth/register.test.ts` (valid/invalid emails, password strength, duplicate email, display name length)
- [X] T011 [P] [US1] Create login unit tests in `apps/game-ako/tests/auth/login.test.ts` (valid credentials, wrong password, unverified email, Google OAuth flow)

### Implementation for User Story 1

- [X] T012 [P] [US1] Create signup API route in `apps/game-ako/src/app/api/auth/signup/route.ts` (POST: validate input with Zod, hash password with bcryptjs, create User, send verification email)
- [X] T013 [P] [US1] Create registration page in `apps/game-ako/src/app/(auth)/register/page.tsx` (email, name, password fields, Google sign-up button, link to login)
- [X] T014 [P] [US1] Create login page in `apps/game-ako/src/app/(auth)/login/page.tsx` (email, password fields, Google sign-in button, forgot-password link, register link)
- [X] T015 [P] [US1] Create auth layout in `apps/game-ako/src/app/(auth)/layout.tsx` (shared layout for login/register/reset pages, centered card with logo)
- [X] T016 [US1] Configure email verification in Auth.js config (`apps/game-ako/src/lib/auth.config.ts`): add email provider with sendVerificationRequest, set verification token expiry to 24h
- [X] T017 [US1] Configure credentials provider in Auth.js config (`apps/game-ako/src/lib/auth.config.ts`): authorize callback validates email + bcryptjs password, checks emailVerified
- [X] T018 [US1] Configure Google provider in Auth.js config (`apps/game-ako/src/lib/auth.config.ts`): add Google provider with allowDangerousEmailAccountLinking for collision handling

**Checkpoint**: Register, verify email, login with credentials and Google all work. Author dashboard is accessible.

---

## Phase 4: User Story 2 - Role-Based Access Control (Priority: P1)

**Goal**: Admin has full access; author is restricted to their own content.
Admin account is pre-seeded before deployment.

**Independent Test**: Log in as admin → full access. Log in as author → admin
routes redirect.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T019 [P] [US2] Create role enforcement tests in `apps/game-ako/tests/auth/roles.test.ts` (admin accesses /admin, author blocked from /admin, unauthenticated redirected to /login, API routes return 401/403)

### Implementation for User Story 2

- [X] T020 [US2] Create Next.js middleware in `apps/game-ako/src/middleware.ts` (protect /admin/* for admin role, /author/* for authenticated users, redirect unauthenticated to /login, return 401/403 for API routes)
- [X] T021 [P] [US2] Create admin dashboard page in `apps/game-ako/src/app/admin/page.tsx` (placeholder with "Review Queue" heading, protected by middleware)
- [X] T022 [P] [US2] Create author dashboard page in `apps/game-ako/src/app/author/page.tsx` (placeholder with "My Retrospectives" heading, protected by middleware)
- [X] T023 [US2] Extend User Mongoose schema in Auth.js adapter config: add `role` field (enum: admin/author, default: author), add `hashedPassword` field
- [X] T024 [US2] Create admin seed script in `apps/game-ako/scripts/seed-admin.ts` (reads ADMIN_EMAIL/ADMIN_PASSWORD from env, connects via db.ts, checks for existing admin, creates if absent with bcryptjs hash and verified email, idempotent, logs result)
- [X] T025 [US2] Add `npm run seed` script to `apps/game-ako/package.json`

**Checkpoint**: Admin can log in and access /admin. Author is blocked from /admin. Seed script creates admin.

---

## Phase 5: User Story 3 - Session & Account Management (Priority: P2)

**Goal**: Password reset flow, logout, profile update, account deletion,
session expiry.

**Independent Test**: Request password reset, complete reset, log in with new
password, log out, verify session terminated.

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T026 [P] [US3] Create password reset tests in `apps/game-ako/tests/auth/reset.test.ts` (request reset for existing email, request for non-existent email always returns success, invalid token rejected, weak new password rejected, Google-only account informed to use Google)
- [X] T027 [P] [US3] Create account management tests in `apps/game-ako/tests/auth/account.test.ts` (profile name update, author account deletion, admin deletion blocked, session invalidation on logout and delete)

### Implementation for User Story 3

- [X] T028 [US3] Create password reset request API route in `apps/game-ako/src/app/api/auth/forgot-password/route.ts` (POST: validate email, check if user has password set, generate reset token, send email; always return same success message)
- [X] T029 [US3] Create password reset confirm API route in `apps/game-ako/src/app/api/auth/reset-password/route.ts` (POST: validate token + new password, update hashedPassword, invalidate all sessions)
- [X] T030 [P] [US3] Create forgot password page in `apps/game-ako/src/app/(auth)/forgot-password/page.tsx` (email field, submit button, link back to login)
- [X] T031 [P] [US3] Create reset password page in `apps/game-ako/src/app/(auth)/reset-password/page.tsx` (new password + confirm fields, token from URL query param, submit updates password)
- [X] T032 [US3] Configure logout in Auth.js: ensure signOut callback clears session cookie and redirects to home page
- [X] T033 [P] [US3] Create profile update API route in `apps/game-ako/src/app/api/user/profile/route.ts` (PATCH: validate session, update name, return updated user)
- [X] T034 [P] [US3] Create account deletion API route in `apps/game-ako/src/app/api/user/account/route.ts` (DELETE: validate session, block admin deletion, delete User + associated Account/Session/VerificationToken documents, clear session)
- [X] T035 [US3] Configure session maxAge to 7 days in Auth.js config (`apps/game-ako/src/lib/auth.config.ts`): set session maxAge to 604800 seconds

**Checkpoint**: Password reset, logout, profile update, and account deletion all work. Sessions expire after 7 days.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, security hardening, and documentation

- [X] T036 Run all auth integration tests and verify >=80% branch coverage on critical paths (`npm run test -- --coverage` in `apps/game-ako/`)
- [X] T037 [P] Verify ESLint passes with zero warnings on all auth source files (`npm run lint` in `apps/game-ako/`)
- [X] T038 [P] Run end-to-end validation per `quickstart.md`: register → verify → login → admin access → password reset → logout → session expiry
- [X] T039 [P] Security audit: verify no passwords in logs, HTTP-only session cookies set, CSRF tokens present on forms, rate limiter blocks after 5 attempts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational
- **User Story 2 (Phase 4)**: Depends on Foundational + US1 (needs working auth to test roles)
- **User Story 3 (Phase 5)**: Depends on Foundational + US1 (needs working auth for reset/logout)
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational. No dependency on US2 or US3.
- **US2 (P1)**: Depends on US1 (users must be able to log in before roles can be tested).
- **US3 (P2)**: Depends on US1 (password reset and logout need working auth). Independent of US2.

### Within Each Phase

- Phase 2: T004-T008 are independent — run in parallel
- Phase 3: Tests T010-T011 before implementation T012-T018
- Phase 4: Test T019 before implementation T020-T025
- Phase 5: Tests T026-T027 before implementation T028-T035
- Phase 6: All tasks can run in parallel

### Parallel Opportunities

- Phase 2: All foundational modules (T004-T008) can be created simultaneously
- Phase 3: Signup route (T012), pages (T013-T015) can be built in parallel after tests are written
- Phase 4: Admin/author dashboards (T021-T022) are parallel
- Phase 5: API routes (T028, T029, T033, T034) and pages (T030, T031) can be parallel within the phase

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001-T003)
2. Phase 2: Foundational (T004-T009)
3. Phase 3: User Story 1 (T010-T018)
4. **STOP and VALIDATE**: Register, verify email, log in with credentials and Google
5. At this point, authors can create accounts — but cannot do anything (no roles yet)

### Incremental Delivery

1. Setup + Foundational → auth infrastructure ready
2. US1 → registration, login, email verification (MVP — users can sign up)
3. US2 → roles enforced, admin seeded, dashboards protected (MVP — editorial workflow possible)
4. US3 → password reset, logout, profile, deletion (complete auth system)
5. Polish → security audit, coverage validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests MUST be written and FAIL before implementation (TDD)
- Auth.js (NextAuth.js v5) uses `auth()`, `signIn()`, `signOut()` from `@/lib/auth`
- MongoDB adapter auto-creates collections: users, accounts, sessions, verification_tokens
- Pre-seeded admin credentials come from env vars ADMIN_EMAIL and ADMIN_PASSWORD
- Rate limiter uses in-memory store; production can swap to Redis
- Commit after each phase or logical group
- Stop at any checkpoint to validate story independently

