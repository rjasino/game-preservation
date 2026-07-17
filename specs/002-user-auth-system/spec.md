# Feature Specification: User Authentication System

**Feature Branch**: `002-user-auth-system`

**Created**: 2026-07-16

**Status**: Draft

**Input**: User description: "Create specs for authentication system of the app. Game Ako Chronicles has 2 user types, admin and author. Admin will have the full access of the site and will review retrospective that author will submit. Author are public user that can register and create retrospective, they can draft and submit it for review, unpublished if necessary. Admin is pre seed before deployment."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Author Registration & Login (Priority: P1)

A gaming enthusiast discovers Game Ako Chronicles and wants to contribute a
retrospective. They visit the site, register an account with their email and a
password (or sign in with their Google account), verify their email address,
and log in to access the author dashboard.

**Why this priority**: Without registration and login, no content can be created
by public users. This is the gateway to all author-facing features.

**Independent Test**: Can be fully tested by registering a new account, verifying
the email, logging in, and confirming the author dashboard is accessible. The
test does not require any retrospective content to exist.

**Acceptance Scenarios**:

1. **Given** a visitor is on the registration page, **When** they complete the
   registration form with a valid email, display name, and password, **Then**
   an account is created in an unverified state and a verification email is sent.
2. **Given** a registered user has received the verification email, **When**
   they click the verification link, **Then** their account is marked as
   verified and they can log in.
3. **Given** a visitor has a Google account, **When** they click "Sign in with
   Google" and authorize the application, **Then** an account is created (and
   auto-verified) and they are logged in immediately.
4. **Given** a verified author navigates to the login page, **When** they enter
   their correct email and password, **Then** they are authenticated and
   redirected to the author dashboard.
5. **Given** a user enters incorrect credentials, **When** they attempt to log
   in, **Then** they see a generic error message ("Invalid email or password")
   and remain on the login page.
6. **Given** a user with an unverified email attempts to log in, **When** they
   enter correct credentials, **Then** they are prompted to verify their email
   before gaining access.

---

### User Story 2 - Role-Based Access Control (Priority: P1)

An admin logs in and has unrestricted access to the entire site. They can view
all retrospectives, review submitted drafts, and publish or unpublish content.
An author logs in and can only access their own dashboard, create and manage
their retrospectives, and cannot access admin-only areas. The admin account
exists before any public users register.

**Why this priority**: Without role enforcement, there is no editorial
workflow. Admin must be able to review content the moment the first author
submits. This is P1 alongside US1 because both must exist for the MVP to
function.

**Independent Test**: Can be tested by logging in as admin (pre-seeded account),
verifying access to all areas, then logging in as an author and confirming
admin-only routes are inaccessible (redirected or denied).

**Acceptance Scenarios**:

1. **Given** the system is first deployed, **When** an admin attempts to log
   in with the pre-seeded credentials, **Then** they are authenticated and have
   full access to the site including an admin dashboard with a review queue.
2. **Given** an author is logged in, **When** they attempt to navigate to an
   admin-only URL (e.g., the review queue), **Then** they are redirected to
   their author dashboard with an access-denied message.
3. **Given** an admin is logged in, **When** they view the review queue, **Then**
   they see all retrospectives submitted for review across all authors.
4. **Given** an unauthenticated visitor attempts to access any protected route,
   **When** they navigate directly to the URL, **Then** they are redirected to
   the login page.
5. **Given** the pre-seeded admin account exists, **When** a deployment occurs,
   **Then** exactly one admin account is present and its credentials are set via
   environment configuration, not hardcoded in source.

---

### User Story 3 - Session & Account Management (Priority: P2)

An author forgets their password and needs to reset it. An admin needs to log
out after their session. A user wants to update their display name or delete
their account entirely.

**Why this priority**: These are quality-of-life flows. The core auth and
role system (US1, US2) can function without them, but real users will need
password resets and logout capabilities shortly after launch.

**Independent Test**: Can be fully tested by requesting a password reset,
completing the reset flow, logging in with the new password, logging out,
and confirming the session is terminated.

**Acceptance Scenarios**:

1. **Given** a user is on the login page, **When** they click "Forgot password"
   and enter their registered email, **Then** a password reset email is sent
   containing a single-use reset link.
2. **Given** a user has received a password reset email, **When** they click
   the reset link and enter a new password meeting the strength requirements,
   **Then** their password is updated and they can log in with the new
   credentials.
3. **Given** an authenticated user on any page, **When** they click "Log out",
   **Then** their session is terminated and they are redirected to the login
   page. Navigating to a protected route afterwards redirects them back to
   login.
4. **Given** an authenticated author viewing their profile, **When** they
   update their display name and save, **Then** the new display name is
   reflected across the site immediately.
5. **Given** an author viewing their account settings, **When** they choose
   "Delete account" and confirm, **Then** their account is permanently removed
   along with any content they own, and their active sessions are invalidated.
6. **Given** an admin viewing their account settings, **When** they attempt to
   delete their account, **Then** the system prevents this because the admin
   account is required for site operation.
7. **Given** a user remains inactive for a configured period (default: 7 days),
   **When** they attempt to access a protected route after that period, **Then**
   their session has expired and they must log in again.

---

### Edge Cases

- **Duplicate email on registration**: If a visitor attempts to register with
  an email already in use (including an email associated with a Google OAuth
  account), the system MUST reject the registration with a message that does
  not reveal whether the email is registered.
- **Google OAuth email collision**: If a user registers with Google OAuth and
  the email already exists as an email/password account, the system MUST link
  the Google identity to the existing account rather than creating a duplicate.
- **Expired verification link**: If a user clicks an email verification link
  after it has expired, the system MUST display a message allowing them to
  request a new verification email.
- **Password reset for Google-only account**: If a user registered exclusively
  via Google OAuth (no password set) and requests a password reset, the system
  MUST inform them that they signed up via Google and should use Google to
  sign in.
- **Rate limiting**: More than 5 failed login attempts from the same IP within
  15 minutes MUST trigger a temporary lockout (15 minutes) with a clear message.
- **Concurrent sessions**: A user may be logged in on multiple devices
  simultaneously. Logging out from one device does not affect other sessions.
- **Admin credential rotation**: The pre-seeded admin credentials can be
  changed after initial deployment through the standard password reset flow.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Visitors MUST be able to register a new account by providing an
  email address, display name, and password.
- **FR-002**: The system MUST validate email format, require a display name
  between 2 and 50 characters, and enforce a minimum password strength (8+
  characters, at least one letter and one number).
- **FR-003**: The system MUST send a verification email upon registration
  containing a unique, time-limited verification link (expires after 24 hours).
- **FR-004**: Users MUST verify their email address before accessing protected
  areas of the site.
- **FR-005**: Google OAuth MUST be supported as an alternative registration
  and login method. Google-authenticated accounts are auto-verified.
- **FR-006**: The system MUST hash all passwords using a strong, modern
  one-way hashing algorithm. Passwords MUST never be stored in plaintext or
  logged.
- **FR-007**: A single admin account MUST be pre-seeded before the first
  deployment, with credentials provided via environment variables. The admin
  role cannot be assigned through the public registration flow.
- **FR-008**: The system MUST enforce role-based access: admin users can access
  all pages and perform all actions; author users can only access author-level
  pages and manage their own content.
- **FR-009**: Unauthenticated requests to protected routes MUST be redirected
  to the login page. Authenticated users accessing routes above their role MUST
  be redirected with an access-denied message.
- **FR-010**: Users MUST be able to log out, which terminates their current
  session immediately.
- **FR-011**: Users MUST be able to request a password reset by providing their
  registered email. The system MUST send a single-use reset link (expires after
  1 hour) only if the email is registered and has a password set.
- **FR-012**: Users MUST be able to update their display name from their
  profile page.
- **FR-013**: Authors MUST be able to delete their own account, which
  permanently removes their user record and any content they own. Admin
  accounts MUST NOT be deletable through the self-service flow.
- **FR-014**: User sessions MUST expire after 7 days of inactivity. Expired
  sessions MUST redirect to the login page on the next protected request.
- **FR-015**: After 5 consecutive failed login attempts from the same IP
  address within a 15-minute window, the system MUST enforce a 15-minute
  lockout for that IP.
- **FR-016**: All authentication and session operations MUST be logged for
  audit purposes (login, logout, registration, password reset, account
  deletion), including timestamp, event type, and user identifier.

### Key Entities

- **User**: Core account record. Fields include unique identifier, email
  (unique), display name, hashed password (nullable if Google-only), Google
  OAuth identifier (nullable), role (admin or author), email verification
  status, account creation timestamp, and last updated timestamp.
- **Session**: Active login session. Fields include session identifier, user
  reference, creation timestamp, expiration timestamp, and last activity
  timestamp.
- **VerificationToken**: Email verification or password reset token. Fields
  include token value, user reference, token type (verify or reset), creation
  timestamp, and expiration timestamp.

### Out of Scope

- Retrospective creation, drafting, submission, and review workflows (separate
  feature spec).
- Admin user interface for managing users (beyond the pre-seeded admin).
- Social login providers beyond Google.
- Two-factor authentication.
- Email service implementation (assumed available; only the token generation
  and verification logic is in scope).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new visitor can complete registration in under 2 minutes from
  landing on the site to receiving the verification email.
- **SC-002**: A returning user can log in with correct credentials and reach
  their dashboard in under 5 seconds.
- **SC-003**: Google OAuth registration and login completes in under 10
  seconds from clicking "Sign in with Google" to reaching the dashboard.
- **SC-004**: 100% of unauthenticated requests to protected routes are
  redirected to the login page (no accidental data exposure).
- **SC-005**: Password reset flow completes in under 3 minutes from request to
  successful login with the new password.
- **SC-006**: The pre-seeded admin account is functional on first deployment
  without any manual database intervention.
- **SC-007**: Zero plaintext passwords or secrets appear in logs, error
  messages, or database records when tested with automated security scans.

## Assumptions

- An email delivery service is available and configured. The verification and
  password reset flows generate tokens and assume the email service will
  deliver them; the token generation and verification logic is the in-scope
  portion.
- The application uses MongoDB via Mongoose as specified in the project
  constitution. The User model leverages Mongoose schemas.
- The pre-seeded admin credentials are provided via environment variables at
  deployment time (ADMIN_EMAIL, ADMIN_PASSWORD). The seed script reads these
  and creates the admin account if it does not already exist.
- Session management uses secure, HTTP-only cookies (not localStorage) as is
  standard for web applications.
- The site runs on a single Next.js application under apps/game-ako/ per the
  project structure constitution.
- Rate limiting is IP-based for the initial implementation. A reverse proxy or
  CDN-aware approach (using X-Forwarded-For) is assumed for production.
- Google OAuth credentials (client ID and secret) are provided via environment
  variables.
- The admin is the only pre-seeded user. Future admin accounts can be created
  manually if needed, but are not part of this feature.
