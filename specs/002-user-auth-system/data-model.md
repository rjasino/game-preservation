# Data Model: User Authentication System

**Feature**: 002-user-auth-system
**Date**: 2026-07-16

## Entities

### User

Represents a registered account. Managed primarily by Auth.js but extended
with application-specific fields via a custom schema.

| Field              | Type       | Description                                      |
|--------------------|------------|--------------------------------------------------|
| id                 | ObjectId   | Unique identifier (MongoDB default)              |
| email              | string     | Unique email address                             |
| emailVerified      | Date|null  | Null until email is verified                     |
| name               | string     | Display name (2-50 characters)                   |
| hashedPassword     | string|null| bcryptjs hash; null for Google-only accounts     |
| role               | enum       | `"admin"` or `"author"`                          |
| image              | string|null| Avatar URL (from Google OAuth or default)        |
| createdAt          | Date       | Account creation timestamp                       |
| updatedAt          | Date       | Last update timestamp                            |

**Validation rules** (application-level):
- `email`: MUST be valid email format, unique across all users
- `name`: 2-50 characters, trimmed
- `hashedPassword`: MUST be null if user has a linked Google account with
  no password set
- `role`: MUST be `"admin"` or `"author"`. Defaults to `"author"` for
  public registrations
- `emailVerified`: MUST be non-null for login to succeed

**State transitions**:
- Created (emailVerified=null) → Verified (emailVerified=Date) via email
  verification link
- Verified → PasswordUpdated via password reset flow
- Verified → Deleted via account deletion (author only)

### Account (Auth.js)

Links external OAuth providers to a User. Managed automatically by the
Auth.js MongoDB adapter.

| Field              | Type       | Description                                      |
|--------------------|------------|--------------------------------------------------|
| userId             | ObjectId   | Reference to User                                |
| type               | string     | `"oauth"` for Google                             |
| provider           | string     | `"google"`                                       |
| providerAccountId  | string     | Google account ID                                |
| access_token       | string|null| OAuth access token (encrypted at rest)           |

### Session (Auth.js)

Active login session. Managed by Auth.js MongoDB adapter.

| Field              | Type       | Description                                      |
|--------------------|------------|--------------------------------------------------|
| sessionToken       | string     | Unique session identifier (stored in cookie)     |
| userId             | ObjectId   | Reference to User                                |
| expires            | Date       | Session expiration (7 days from last activity)   |

### VerificationToken (Auth.js)

Email verification and password reset tokens. Managed by Auth.js.

| Field              | Type       | Description                                      |
|--------------------|------------|--------------------------------------------------|
| identifier         | string     | User email                                       |
| token              | string     | Unique token value                               |
| expires            | Date       | Token expiration (24h verify, 1h reset)          |

### Relationships

```
User 1 --- * Account      (OAuth provider links)
User 1 --- * Session       (active login sessions)
User 1 --- * VerificationToken (pending verifications/resets)
```

## MongoDB Collections

Auth.js creates and manages these collections automatically via its adapter:
- `users` — extends with custom fields (role, hashedPassword)
- `accounts` — OAuth provider links
- `sessions` — active sessions
- `verification_tokens` — email tokens

## Indexes

| Collection           | Index                  | Purpose                       |
|----------------------|------------------------|-------------------------------|
| users                | `{ email: 1 }` unique  | Fast lookup by email          |
| sessions             | `{ sessionToken: 1 }`  | Session validation            |
| sessions             | `{ expires: 1 }` TTL   | Auto-cleanup expired sessions |
| verification_tokens  | `{ token: 1 }`         | Token lookup                  |
| verification_tokens  | `{ expires: 1 }` TTL   | Auto-cleanup expired tokens   |
