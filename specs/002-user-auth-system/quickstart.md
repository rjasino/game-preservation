# Quickstart: User Authentication System

**Feature**: 002-user-auth-system
**Date**: 2026-07-16

## Prerequisites

| Requirement          | How to verify                        |
|----------------------|--------------------------------------|
| Scaffolded app       | `apps/game-ako/` exists              |
| Node.js 18+          | `node --version`                     |
| MongoDB running      | `mongosh` connects successfully      |
| Google Cloud project | OAuth credentials available          |

## Environment Setup

Create `.env.local` in `apps/game-ako/`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/game-ako

# Auth secret (generate with: openssl rand -base64 32)
AUTH_SECRET=your-generated-secret-here

# Google OAuth
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# Pre-seeded admin
ADMIN_EMAIL=admin@gameakochronicles.com
ADMIN_PASSWORD=ChangeMeOnFirstLogin1

# App URL
AUTH_URL=http://localhost:3000
```

## Install Dependencies

```bash
cd apps/game-ako
npm install next-auth@beta @auth/mongodb-adapter bcryptjs
npm install -D @types/bcryptjs
```

## Seed Admin Account

```bash
cd apps/game-ako
npx tsx scripts/seed-admin.ts
```

**Expected output**:
```
Admin account created: admin@gameakochronicles.com
```

## Run the App

```bash
npm run dev
```

## Validation Scenarios

### 1. Author Registration

1. Open http://localhost:3000/register
2. Fill in: email, display name, password (8+ chars, 1 letter + 1 number)
3. Submit → see "Check your email" message
4. Check email → click verification link → redirected to login
5. Log in with credentials → redirected to author dashboard

### 2. Google OAuth Login

1. Open http://localhost:3000/login
2. Click "Sign in with Google"
3. Authorize → redirected to dashboard (auto-verified)
4. Log out → confirm session is cleared

### 3. Admin Access

1. Log in as admin@gameakochronicles.com with pre-seeded password
2. Confirm access to http://localhost:3000/admin (review queue visible)
3. Log out, log in as author → navigate to /admin → confirm redirect

### 4. Password Reset

1. From login page, click "Forgot password"
2. Enter author email → receive reset email
3. Click link → set new password → log in with new password

### 5. Session Expiry

1. Log in, note the time
2. Wait >7 days (or set session maxAge to 60s for testing)
3. Refresh a protected page → redirected to login

### 6. Rate Limiting

1. Attempt to log in with wrong password 6 times within 15 minutes
2. On 6th attempt → see lockout message
3. Wait 15 minutes → can attempt again

## Running Tests

```bash
npm run test -- --reporter verbose
```

Expected: All auth tests pass (unit + integration), coverage >= 80% on
critical paths (login, registration, role enforcement, token validation).
