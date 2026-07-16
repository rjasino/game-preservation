# Data Model: App Scaffolding & Health Check

**Feature**: 001-app-scaffold
**Date**: 2026-07-16

## Entities

### CheckResult

Represents the outcome of a single health check verification.

| Field       | Type     | Description                                               |
|-------------|----------|-----------------------------------------------------------|
| name        | string   | Human-readable check name (e.g., "TypeScript Compilation") |
| status      | enum     | `pass` or `fail`                                          |
| message     | string?  | Error description if `status` is `fail`; null if `pass`   |
| durationMs  | number   | Execution time in milliseconds                            |

**Validation rules**:
- `name` MUST be non-empty.
- `status` MUST be exactly `"pass"` or `"fail"`.
- `message` MUST be non-null when `status` is `"fail"`.
- `durationMs` MUST be ≥ 0.

**State transitions**: None — CheckResult is immutable once created.

### CheckSuite

Aggregates all individual check results and produces a summary.

| Field       | Type           | Description                                    |
|-------------|----------------|------------------------------------------------|
| results     | CheckResult[]  | Ordered list of all check results              |
| totalCount  | number         | Total number of checks executed                |
| passCount   | number         | Number of checks that passed                   |
| failCount   | number         | Number of checks that failed                   |
| allPassed   | boolean        | `true` if `failCount === 0`                    |
| totalDurationMs | number     | Sum of all individual check durations           |

**Derived fields**:
- `allPassed` = `failCount === 0`
- `totalDurationMs` = sum of `results[].durationMs`

**Validation rules**:
- `passCount + failCount` MUST equal `totalCount`.
- `results.length` MUST equal `totalCount`.
- If `allPassed` is `true`, exit code is 0; otherwise exit code is 1.

## No Persistent Storage

The scaffold feature does not define any database models. The health check
results exist only in memory during execution. MongoDB models will be defined
in subsequent features (e.g., user accounts, game catalog, preservation lists).
