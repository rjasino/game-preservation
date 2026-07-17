# Contracts: User Authentication System

**Feature**: 002-user-auth-system
**Date**: 2026-07-16

## Overview

All authentication endpoints are handled by NextAuth.js (Auth.js) route
handlers at `/api/auth/[...nextauth]`. The following contracts document
the expected behavior for each operation.

---

## 1. Registration (Email/Password)

### Request

```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "author@example.com",
  "name": "Jane Doe",
  "password": "SecurePass1"
}
```

### Success Response (201)

```json
{
  "message": "Account created. Please check your email to verify your account."
}
```

### Error Responses

| Status | Condition                    | Body                                      |
|--------|------------------------------|-------------------------------------------|
| 409    | Email already registered     | `{ "error": "Email already in use" }`    |
| 422    | Validation failure           | `{ "error": "...", "fields": {...} }`     |
| 429    | Rate limited                 | `{ "error": "Too many requests" }`        |

### Side Effects
- Creates User document (emailVerified=null)
- Sends verification email with magic link

---

## 2. Login (Email/Password)

### Request

```http
POST /api/auth/callback/credentials
Content-Type: application/json

{
  "email": "author@example.com",
  "password": "SecurePass1",
  "csrfToken": "<from /api/auth/csrf>"
}
```

### Success Response (302)

Redirects to dashboard. Sets session cookie.

### Error Responses

| Status | Condition                    | Body                                      |
|--------|------------------------------|-------------------------------------------|
| 401    | Invalid credentials          | Redirect to login?error=CredentialsSignin |
| 401    | Email not verified           | Redirect to login?error=EmailNotVerified   |
| 429    | Rate limited                 | `{ "error": "Too many attempts" }`        |

### Side Effects
- Creates Session document
- Sets HTTP-only session cookie
- Resets failed login counter for IP

---

## 3. Google OAuth Login/Registration

### Flow

1. User clicks "Sign in with Google" → GET `/api/auth/signin/google`
2. Redirected to Google consent screen
3. After authorization → GET `/api/auth/callback/google?code=...`
4. Auth.js creates/links account, creates session, redirects to dashboard

### Email Collision

If a Google-authenticated email matches an existing email/password account:
- Links Google identity to existing User (adds Account document)
- Sets emailVerified if not already set
- Does NOT overwrite existing password

---

## 4. Logout

### Request

```http
POST /api/auth/signout
```

### Success Response (302)

Redirects to home page. Clears session cookie.

### Side Effects
- Deletes current Session document
- Clears session cookie

---

## 5. Password Reset

### Request Reset

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "author@example.com"
}
```

### Response (200) — always the same regardless of email existence

```json
{
  "message": "If that email is registered, a reset link has been sent."
}
```

### Confirm Reset

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "<reset-token>",
  "password": "NewSecurePass2"
}
```

### Response (200)

```json
{ "message": "Password updated. You can now log in." }
```

### Error Responses

| Status | Condition                    | Body                                      |
|--------|------------------------------|-------------------------------------------|
| 401    | Invalid/expired token        | `{ "error": "Invalid or expired token" }` |
| 422    | Password too weak            | `{ "error": "Password does not meet..." }`|

---

## 6. Profile Update

### Request

```http
PATCH /api/user/profile
Content-Type: application/json
Cookie: <session>

{
  "name": "New Display Name"
}
```

### Success Response (200)

```json
{
  "id": "...",
  "name": "New Display Name",
  "email": "author@example.com",
  "role": "author"
}
```

### Error Responses

| Status | Condition                    | Body                                      |
|--------|------------------------------|-------------------------------------------|
| 401    | Not authenticated            | `{ "error": "Unauthorized" }`             |

---

## 7. Account Deletion

### Request

```http
DELETE /api/user/account
Cookie: <session>
```

### Success Response (200)

```json
{ "message": "Account deleted." }
```

### Error Responses

| Status | Condition                    | Body                                      |
|--------|------------------------------|-------------------------------------------|
| 401    | Not authenticated            | `{ "error": "Unauthorized" }`             |
| 403    | Admin account                | `{ "error": "Admin account cannot be" }`  |

### Side Effects
- Deletes User document
- Deletes all Account, Session, VerificationToken documents for user
- Clears session cookie

---

## 8. Role Enforcement Middleware

### Behavior

| Route Pattern           | Required Role | Unauthenticated         | Wrong Role        |
|-------------------------|---------------|-------------------------|-------------------|
| `/admin/*`              | admin         | Redirect to /login     | Redirect to /     |
| `/author/*`             | author        | Redirect to /login     | N/A               |
| `/api/admin/*`          | admin         | 401 JSON               | 403 JSON          |
| Public routes (`/`,...) | none          | Allowed                 | Allowed           |

Admin routes are protected by middleware that checks the session role claim.
The middleware runs on every request matching the configured matcher patterns.
