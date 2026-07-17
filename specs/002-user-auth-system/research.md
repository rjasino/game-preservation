# Research: User Authentication System

**Feature**: 002-user-auth-system
**Date**: 2026-07-16

## 1. Authentication Library

**Decision**: Use NextAuth.js v5 (Auth.js) with the App Router integration.

**Rationale**: Auth.js is the de facto authentication library for Next.js. It
provides built-in providers for credentials (email/password) and Google OAuth,
automatic CSRF protection, session management with JWT or database strategies,
and middleware for route protection. The v5 release targets Next.js App Router
natively with server components and server actions.

**Key features used**:
- Credentials provider for email/password login
- Google provider for OAuth
- MongoDB adapter for storing users, sessions, and verification tokens
- Middleware for protecting routes and enforcing roles
- Email provider for verification and password reset emails

**Alternatives considered**:
- Custom auth with jose/iron-session — rejected: would require building
  CSRF protection, OAuth flows, and email verification from scratch,
  adding weeks of work with higher security risk.
- Clerk / Auth0 — rejected: external services that add cost and vendor
  lock-in. The constitution does not mandate third-party auth services.

## 2. Password Hashing

**Decision**: Use bcryptjs with a cost factor of 12.

**Rationale**: bcryptjs is a pure JavaScript implementation of bcrypt with
no native dependencies, so it works across all platforms without compilation
issues. A cost factor of 12 provides strong protection while keeping login
latency under 500ms on typical hardware.

**Alternatives considered**:
- argon2 — rejected: requires native bindings that can cause installation
  issues on Windows and in CI environments.
- Node.js crypto.scrypt — rejected: bcryptjs has a simpler API and is more
  widely audited for password storage.

## 3. Session Strategy

**Decision**: Use database-backed sessions stored in MongoDB via the Auth.js
MongoDB adapter.

**Rationale**: Database sessions enable:
- Session invalidation on logout, password change, or account deletion
- Concurrent sessions across multiple devices
- Session expiry with configurable maxAge
- Audit trail of active sessions

The Auth.js MongoDB adapter automatically creates the required collections
(`users`, `accounts`, `sessions`, `verification_tokens`) and handles
session CRUD operations.

**Alternatives considered**:
- JWT-only sessions — rejected: cannot invalidate individual sessions
  without a token blacklist, which is essentially a database.
- Redis sessions — rejected: adds infrastructure complexity. MongoDB is
  the project standard; using it for sessions avoids an extra dependency.

## 4. Google OAuth Integration

**Decision**: Use the Auth.js Google provider with OAuth 2.0.

**Setup required**:
- Register application in Google Cloud Console
- Configure OAuth consent screen
- Obtain Client ID and Client Secret
- Set callback URL to `/api/auth/callback/google`
- Store credentials in `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` env vars

**Email collision handling**: Auth.js, by default, links the Google account
to an existing user if the email matches. The `allowDangerousEmailAccountLinking`
option is set to `true` in the provider config to enable this behavior for
Google-authenticated accounts only. This is safe because Google verifies
email ownership.

**Alternatives considered**:
- Manual OAuth with `google-auth-library` — rejected: Auth.js handles the
  entire flow including token refresh and callback state.

## 5. Admin Account Pre-Seeding

**Decision**: A deployment seed script that runs before the application starts,
checking for an existing admin user and creating one if absent.

**Implementation**:
- Script reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from environment variables
- Connects to MongoDB via the cached connection module (`src/lib/db.ts`)
- Checks for existing user with `role: "admin"`
- If none exists, creates the admin user with hashed password and verified
  email status
- Logs the result (created or already exists) and exits

**Security**:
- Admin password is never hardcoded in source
- Script is idempotent — safe to run on every deployment
- If env vars are missing, the script logs a warning and skips (does not
  crash the app)

**Alternatives considered**:
- Manual DB insertion — rejected: error-prone and not reproducible.
- Admin registration page — rejected: security risk; admin must come from
  a trusted source.

## 6. Rate Limiting

**Decision**: Implement an in-memory rate limiter for login attempts using a
sliding-window counter. Production deployments can swap in a Redis-based
limiter.

**Rules**:
- Window: 15 minutes
- Max attempts: 5 per IP
- Lockout duration: 15 minutes after exceeding limit
- Uses X-Forwarded-For header when behind a reverse proxy

**Alternatives considered**:
- External service (Upstash, Vercel KV) — deferred for production; the
  in-memory limiter is sufficient for development and small-scale deployments.

## 7. Auth.js Configuration Summary

| Config Option          | Value                           |
|------------------------|---------------------------------|
| Session strategy       | database (MongoDB adapter)      |
| Session maxAge         | 7 days (604800 seconds)         |
| Password hash          | bcryptjs, cost factor 12        |
| Email verification     | Magic-link token via email      |
| Password reset         | Token via email, 1 hour expiry  |
| Google OAuth           | Provider with email linking     |
| CSRF protection        | Built-in (Auth.js middleware)   |
| Route protection       | Auth.js middleware + role check |
