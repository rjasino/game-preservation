---
name: nextjs-logic
description: Design and implement Next.js App Router logic with TypeScript-first coding style, Vitest + React Testing Library + Playwright testing standards, and strong user experience. Use when building pages, server actions, route handlers, forms, data fetching, caching, and feature flows in a Next.js app.
---

# Next.js Logic

## When to Use

Use this skill when the task involves Next.js App Router behavior rather than only presentational markup.

- Build or refactor App Router features
- Add server actions, route handlers, or API integrations
- Decide between server and client components
- Implement forms, mutations, caching, or revalidation
- Add tests for feature logic and user flows
- Improve loading, error, empty, and success states

## Outcome

Produce a Next.js implementation that is:

- Server-first unless interactivity requires client code
- Typed at boundaries and explicit about data contracts
- Easy to test with unit, integration, and flow-level coverage
- Accessible and resilient under loading, failure, and empty-data conditions

## Coding Style Principles

- Prefer TypeScript-first implementations with explicit types on public boundaries.
- Keep business logic out of JSX when it can live in helpers, actions, or server utilities.
- Default to Server Components; add `"use client"` only for browser state, event handlers, or client-only APIs.
- Keep modules small and feature-oriented. Put validation, mapping, and transformation near the feature instead of scattering it across the app.
- Validate external input at the boundary using a schema or equivalent guard before the rest of the feature trusts the data.
- Prefer clear names over abbreviations. Make route, action, and helper names describe the user-facing behavior.
- Avoid hidden side effects. Mutations should be obvious in server actions, route handlers, or dedicated service functions.
- Reuse existing project patterns before introducing new abstractions.

## User Experience Principles

- Every async screen or mutation must define loading, empty, error, and success behavior.
- Make important actions discoverable and explain irreversible or destructive operations before execution.
- Keep forms tolerant of user mistakes: preserve values on validation errors, show field-level messages, and focus the first invalid field when appropriate.
- Prefer progressive enhancement where possible so core flows still work without fragile client-side orchestration.
- Use optimistic updates only when rollback behavior is clear and failure messaging is acceptable.
- Preserve accessibility with semantic elements, proper labels, keyboard support, and meaningful status messages.
- Keep perceived performance in mind: stream server content when it helps, defer non-critical detail, and avoid unnecessary client waterfalls.

## Testing Standard

- Add or update tests for every behavior change.
- Use Vitest for unit and integration coverage around helpers, validators, data loaders, server actions, route handlers, and cache invalidation behavior.
- Use React Testing Library for component behavior where rendered state and interaction matter.
- Use Playwright for critical user flows such as submitting forms, authentication gates, search, filtering, and multi-step interactions.
- Test the unhappy paths, not just the success path: invalid input, empty responses, permission failures, and upstream service errors.
- Mock at the network or boundary layer instead of mocking internal implementation details when practical.
- Keep assertions user-visible where possible: rendered state, redirect behavior, returned payload, and persisted side effects.

## Decision Guide

### 1. Choose the rendering boundary

- Use a Server Component when the UI can be fully derived from request-time data.
- Use a Client Component when the feature needs browser state, event-driven interactivity, or client-only libraries.
- Split the feature when only a small interactive region needs to be client-side.
- Stay within App Router conventions for layouts, nested routes, loading states, and route-level errors.

### 2. Choose the mutation boundary

- Use a server action for form-oriented mutations initiated from the UI.
- Use a route handler when the feature also needs a stable HTTP interface for external callers or non-form clients.
- Use a shared server-side helper when both paths need the same core mutation logic.

### 3. Choose the data strategy

- Fetch on the server by default.
- Cache when stale data is acceptable and the invalidation path is clear.
- Revalidate tagged or routed data immediately after mutations that affect rendered content.
- Use client fetching only when the data is user-session-specific, frequently refreshed, or dependent on browser-only context.

### 4. Choose the validation strategy

- Validate request bodies, query params, form data, and external API responses at the boundary.
- Return structured validation errors that the UI can render without guessing.

## Procedure

### Step 1: Define the feature contract

- Identify the user goal, route, inputs, outputs, and failure modes.
- State whether the feature is read-only, mutating, authenticated, or role-restricted.

### Step 2: Map the feature shape

- Decide which parts are Server Components, Client Components, server actions, route handlers, and shared utilities.
- Keep the smallest possible client surface.

### Step 3: Model the data boundary

- Define request and response types.
- Add schema validation for external or user-provided input.
- Normalize upstream data before it reaches UI components.

### Step 4: Implement server-first logic

- Put data access, mutation rules, and authorization checks on the server.
- Make caching and revalidation explicit.
- Keep UI components focused on rendering state and invoking actions.

### Step 5: Build state coverage into the UI

- Add loading, empty, error, and success states.
- Ensure messages are specific enough for users to recover.
- Confirm keyboard and screen-reader behavior for forms and interactive controls.

### Step 6: Add tests at the right layers

- Unit-test pure logic with Vitest.
- Integration-test server behavior and boundary validation with Vitest.
- Use React Testing Library for interactive component states.
- Add a Playwright flow when the feature is business-critical or easy to regress.

### Step 7: Review against completion criteria

- The server/client split is intentional and minimal.
- Validation exists at each external boundary.
- Caching and revalidation behavior are documented in code.
- Tests cover success and failure paths.
- UX states are complete and accessible.

## Completion Checklist

- Feature behavior matches the route and product goal.
- No unnecessary client component was introduced.
- Data fetching and mutation logic live in the correct boundary.
- Errors are actionable for both users and developers.
- Loading and empty states are present where needed.
- Tests cover the core flow and at least one failure path.
- The implementation uses App Router patterns instead of Pages Router conventions.
- New code follows the project naming, file placement, and styling conventions.

## Example Prompts

- Build a Next.js App Router feature for creating projects with a server action, validation, and tests.
- Refactor this page so data fetching stays server-side and only the filter controls are client-side.
- Add a route handler for exporting reports and cover it with integration tests.
- Improve the UX of this form with loading, validation, optimistic feedback, and accessible errors.
