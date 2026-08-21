# Relay Support Ticket & SLA Tracker

Relay is a support operations workspace for the Burdenoff Product Engineering Intern take-home. It combines a schema-first GraphQL API, PostgreSQL persistence, a pure business-hours SLA engine, and a responsive Next.js interface.

## Stack

- Bun 1.3, TypeScript strict mode, ESLint
- GraphQL Yoga with SDL-first schema files
- PostgreSQL 16, Prisma schema and committed SQL migration
- Next.js App Router and React
- Luxon for timezone-safe business-hour arithmetic

## Architecture

`apps/api` owns authentication, authorization, GraphQL, Prisma access, and all domain logic. `apps/api/src/services/sla` is intentionally pure and does not import Prisma, a server, or a clock. GraphQL resolvers validate inputs and delegate work. `apps/web` is a Next.js BFF UI: its httpOnly cookie is read only by server code and its `/api/graphql` route forwards the token to the API.

The primary tables are `User`, `Ticket`, `Comment`, `Holiday`, and `TicketEvent`. Ticket indexes cover status, priority, assignee, due timestamps, and the descending creation cursor.

## Database schema

`User` is the authenticated reporter or agent. `Ticket` stores the lifecycle timestamps alongside materialized SLA due and at-risk timestamps, which keeps queue filters and dashboard counts indexable. `Comment` records the author and is used to freeze the first-response clock. `Holiday` drives the business calendar. `TicketEvent` records creation, assignment, status changes, pauses, resumes, resolution, reopening, and comments for the activity timeline.

## SLA calculation

Business time is Monday to Friday, 09:00 through 18:00 in `BUSINESS_TIMEZONE`. Time outside that window, weekends, and Holiday records consume zero SLA minutes. All persisted timestamps are UTC and the API serializes them as ISO 8601.

| Priority | First response | Resolution |
| --- | ---: | ---: |
| URGENT | 1 business hour | 4 business hours |
| HIGH | 4 business hours | 24 business hours |
| MEDIUM | 8 business hours | 48 business hours |
| LOW | 24 business hours | 72 business hours |

At exactly 75 percent of a budget, a clock is `ON_TRACK`. It becomes `AT_RISK` only after 75 percent, and `BREACHED` at or after its deadline. First non-reporter comments freeze first-response SLA. Resolution freezes resolution SLA. A frozen on-time clock stays `MET`, while a frozen late clock stays `BREACHED`.

Tickets in `WAITING_ON_CUSTOMER` pause their active clocks. Resuming adds only elapsed business minutes, recalculates persisted targets, and preserves prior consumption. Adding or deleting a holiday recomputes targets for active tickets.

## Transitions and access

`OPEN` can move to `IN_PROGRESS`, `WAITING_ON_CUSTOMER`, or `RESOLVED`. `IN_PROGRESS` can move to `WAITING_ON_CUSTOMER`, `RESOLVED`, or `OPEN`. `WAITING_ON_CUSTOMER` can move to `IN_PROGRESS` or `RESOLVED`. `RESOLVED` can move to `CLOSED` or `OPEN`. `CLOSED` can only move to `OPEN`.

Reporters can register, create tickets, comment, and access their own tickets. Agents can access all tickets, assign work, change state, resolve work, and manage holidays. Passwords use Bun's Argon2id implementation and the API returns short-lived signed JWTs.

## Setup

```sh
cp .env.example .env
docker compose up -d
bun install
bun run gendb
bun run seed
bun run dev
```

The API starts at `http://localhost:4000/graphql` and the UI at `http://localhost:3000`. To run the complete Docker profile, use `docker compose --profile full up --build`. The API container applies committed Prisma migrations before it begins serving requests.

To apply migrations without seeding, run `bun run gendb`. To run each process separately, use `bun --cwd apps/api dev` and `bun --cwd apps/web dev` in separate terminals after the database is available.

Seeded agent credentials are `agent@relay.dev` / `RelayPass2026!`.

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signing secret, minimum 32 characters |
| `BUSINESS_TIMEZONE` | Calendar timezone, default `Asia/Kolkata` |
| `AGENT_INVITE_CODE` | Required for agent registration |
| `API_PORT` | Yoga port, default `4000` |
| `NEXT_PUBLIC_API_URL` | API endpoint used by Next.js |

## Validation and testing

```sh
bun run typecheck
bun run lint
bun run test:unit
bun run test:integration
bun run bench
```

The unit suite exercises business-hour boundaries, holidays, risk state, frozen SLA behavior, and frozen remaining-time snapshots. The integration suite targets real PostgreSQL on port 5434 by default and verifies ticket/comment persistence and first-response materialization. `bun run bench` performs twenty indexed ticket-list samples and fails if p95 exceeds 25 ms. Set `TEST_DB_PORT` and `TEST_DATABASE_URL` together if port 5434 is unavailable. CI runs the same checks plus the production Next.js build against a PostgreSQL service.

## Interface notes

The queue is server-rendered for its first paint, with filter controls for status, priority, assignee, and SLA state. Detail and list screens render the server-provided SLA verdict and a tabular countdown. The countdown never calculates risk or breach in the browser. Holiday management is available to agents and recalculates active ticket targets immediately. Keyboard focus, reduced-motion preferences, and narrow table layouts are handled in the shared UI layer.

## Example GraphQL

```graphql
query Queue {
  tickets(priority: HIGH, slaState: AT_RISK, take: 20) {
    edges { node { reference title status sla { resolutionState resolutionRemainingMinutes } } }
    pageInfo { hasNextPage endCursor }
  }
}
```

```graphql
mutation CreateTicket {
  createTicket(title: "Cannot export report", description: "CSV export ends with an error.", priority: HIGH) {
    id
    sla { resolutionDueAt resolutionState }
  }
}
```

## How I would extend it

With more time I would add email notifications, escalation policies, team calendars, recurring holidays, refresh-token rotation, end-to-end browser tests, and agent performance analytics.
