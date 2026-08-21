# Submission checklist

This file is the release checklist for the Burdenoff take-home. Checked items are implemented in the workspace and verified where noted.

## Product and API

- [x] Bun and strict TypeScript with no implicit `any`
- [x] Schema-first GraphQL Yoga API with SDL in a `.graphql` file
- [x] PostgreSQL Prisma schema, committed migration, relations, indexes, and database checks
- [x] Registration, login, Argon2id password hashing, signed short-lived JWTs, and server-side authorization
- [x] Create, assign, transition, resolve, and comment mutations
- [x] Cursor pagination and status, priority, assignee, and SLA-state filters
- [x] Dashboard counts, users, holidays, and ticket detail queries
- [x] Typed GraphQL business errors for validation, access, missing records, and invalid transitions

## SLA correctness

- [x] Pure isolated business-hours SLA module with configurable timezone
- [x] Default policy budgets match the brief
- [x] Weekday, before-hours, after-hours, Friday evening, weekend, holiday, and multi-day calculation coverage
- [x] At-risk boundary, breach, frozen state, and frozen remaining-time coverage
- [x] First non-reporter comment freezes first-response SLA exactly once
- [x] Resolution freezes the resolution SLA
- [x] Waiting-on-customer pauses active clocks and resume/reopen preserve elapsed business time
- [x] Holiday changes recalculate active persisted SLA targets within the same database transaction
- [x] API, rather than the browser, decides SLA state

## Interface and delivery quality

- [x] Responsive dashboard, queue, filters, sort, load-more pagination, ticket creation, detail, comments, assignment, transitions, and holiday management
- [x] Live server-anchored countdown, light and dark themes, loading skeletons, keyboard focus, reduced-motion support, and explicit error states
- [x] Seed data and documented credentials
- [x] Docker Compose, Dockerfiles, CI workflow, environment example, README, and walkthrough
- [x] `bun run typecheck`, `bun run lint`, `bun run test:unit`, and `bun --cwd apps/web build` pass on 2026-08-21
- [x] `bun run test:integration` passes against the Docker test database on 2026-08-21
- [x] Ticket-list benchmark passed inside the API container on 2026-08-21: p95 8.20 ms across 20 samples
- [ ] Initialize the requested Git repository, create incremental commits, push it, and open the PR against `main`

The remaining Git and PR item requires a user-owned remote repository and explicit publication authority. It remains deliberately unchecked until that external action is performed.
