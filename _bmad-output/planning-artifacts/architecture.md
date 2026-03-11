---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions', 'step-05-patterns', 'step-06-structure', 'step-07-validation', 'step-08-complete']
inputDocuments: ['_bmad-output/planning-artifacts/prd.md']
workflowType: 'architecture'
project_name: 'bot-chatter'
user_name: 'mrchatbot'
date: '2026-03-11'
status: 'complete'
completedAt: '2026-03-11'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
33 FRs across 7 capability areas. Core capabilities center on a task dispatch and accountability loop: Managers/Admins compose tasks (simple or coin stress test), the system broadcasts to Telegram, Staff claim and complete tasks through the web app, and every state change is reflected in both the Telegram GC and the real-time task table. Supporting capabilities include Clerk-based auth with role assignment, admin-managed dropdown options (subjects/coins), Telegram config management, and in-app notifications.

**Non-Functional Requirements:**
- Performance: Task dispatch under 5 seconds end-to-end, real-time updates under 1 second, page load under 3 seconds, smooth rendering up to 500 tasks, 50 concurrent users
- Security: HTTPS only, Telegram bot token server-side only, RBAC enforced at UI and API layers, Clerk manages all credentials
- Integration: Telegram Bot API with 3-retry exponential backoff, Clerk webhooks for user events, Convex scheduled functions with +/- 60s tolerance
- Reliability: 99% uptime, graceful Telegram degradation with queued retries, transactional mutations, optimistic locking on task claims

**Scale & Complexity:**

- Primary domain: Full-stack web (Next.js + Convex + Clerk + Telegram Bot API)
- Complexity level: Low
- Estimated architectural components: ~8 (Auth layer, Task dispatch, Task lifecycle, Telegram integration, Scheduled reminders, Notification system, Admin config, Real-time data layer)

### Technical Constraints & Dependencies

- **Convex** as sole database and backend — all mutations, queries, actions, and scheduled functions run through Convex
- **Clerk** for authentication — role metadata stored in Clerk, synced via webhooks
- **Telegram Bot API** — HTTP-based, rate-limited, called only from Convex actions (never client-side)
- **Next.js App Router** — SPA mode, no SSR/SSG needed (internal tool behind auth)
- **Vercel** deployment target — serverless, managed infrastructure

### Cross-Cutting Concerns Identified

- **Authorization**: Every Convex mutation/query must validate user role before executing — Admin, Manager, and Staff have distinct permissions
- **Telegram delivery**: Multiple features trigger Telegram messages (dispatch, acknowledge, complete, reminders) — needs a shared, reliable delivery mechanism with retry logic
- **Audit trail**: All task state changes must be persisted with timestamps and actor identity for accountability
- **Real-time sync**: Convex subscriptions power live updates across task table, notifications, and status changes

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application based on Next.js App Router with Convex real-time backend, Clerk authentication, and Telegram Bot API integration.

### Existing Project Foundation

The project was initialized with `create-next-app` and already includes:
- Next.js 16.1.6 (App Router)
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4
- ESLint with Next.js config

### Starter Options Considered

| Option | Approach | Verdict |
|---|---|---|
| `npm create convex -t nextjs-clerk-shadcn` | Fresh project with full stack pre-wired | Not ideal — would replace existing Next.js 16 setup |
| Official `get-convex/template-nextjs-clerk-shadcn` | Reference template on GitHub | Useful as wiring reference, not as replacement |
| **Add to existing project** | Install Convex, Clerk, shadcn/ui into current project | **Selected** — preserves current setup, adds what's needed |

### Selected Approach: Incremental Addition to Existing Project

**Rationale:** The project already has a current Next.js 16 foundation with Tailwind 4. Adding Convex, Clerk, and shadcn/ui as packages is straightforward and avoids version conflicts from older starter templates.

**Required Package Additions:**

```bash
# Convex backend
npm install convex

# Clerk authentication
npm install @clerk/nextjs

# UI component library
npx shadcn@latest init

# Toast notifications (for success toasts on dispatch)
# Installed via shadcn CLI as needed
```

**Architectural Decisions Provided by Foundation:**

**Language & Runtime:**
TypeScript 5 with strict mode, targeting Node.js serverless (Vercel)

**Styling Solution:**
Tailwind CSS 4 + shadcn/ui components (accessible, composable, Tailwind-native)

**Build Tooling:**
Next.js built-in bundler (Turbopack for dev), ESLint for linting

**Testing Framework:**
To be determined in architectural decisions step

**Code Organization:**
Next.js App Router conventions — `app/` for routes, `convex/` for backend functions and schema, `components/` for UI components

**Development Experience:**
- `next dev` + `npx convex dev` running concurrently for hot reload on both frontend and backend
- Convex dashboard for database inspection and function logs
- Clerk dashboard for user/role management during development

**Reference Template:** [get-convex/template-nextjs-clerk-shadcn](https://github.com/get-convex/template-nextjs-clerk-shadcn) for wiring patterns (ConvexProviderWithClerk, middleware setup, auth helpers)

**Note:** Project initialization and package setup should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Role storage: Both Clerk + Convex synced
- Convex schema: Flat with selective references
- Authorization: Per-function role checks via reusable helper
- Telegram: Shared Convex action with retry logic

**Important Decisions (Shape Architecture):**
- Validation: Zod on client + Convex validators on server
- State management: Convex subscriptions (no extra state library)
- Component structure: Feature-based folders under `components/`

**Deferred Decisions (Post-MVP):**
- Testing framework (add when needed)
- CI/CD pipeline (manual Vercel deploys for MVP)
- Monitoring/logging (Convex dashboard sufficient for MVP)

### Data Architecture

**Role Storage: Clerk + Convex synced**
- Clerk `publicMetadata.role` for middleware route protection and UI gating
- Convex `users` table with role field for backend queries (FR2: admin user list)
- Clerk webhook on `user.created` / `user.updated` syncs to Convex
- Rationale: Admins need to query users by role in Convex, but Clerk middleware needs role for route protection

**Schema Design: Flat with selective references**
- `users` — clerkId, name, email, role, createdAt
- `tasks` — type (simple/stressTest), subjectId (ref), coinId (ref, optional), body, senderId (ref to users), claimerId (ref, optional), status (pending/claimed/done), startTime, endTime, createdAt, claimedAt, completedAt
- `subjects` — name, isActive
- `coins` — name, isActive
- `notifications` — userId (ref), type, taskId (ref), read, createdAt
- `settings` — key, value (for Telegram bot token, chat ID overrides)

**Data Validation: Zod + Convex validators**
- Zod schemas for client-side form validation with immediate feedback
- Convex `v.object()` argument validators on every mutation as server-side enforcement
- Shared type definitions derived from Convex schema

### Authentication & Security

**Auth Flow:**
- Clerk `<ClerkProvider>` wraps app, `<ConvexProviderWithClerk>` bridges auth to Convex
- Clerk middleware protects all routes except `/sign-in` and `/sign-up`
- Users without a role see a "pending approval" screen

**Authorization Pattern: Reusable helper function**
- `requireRole(ctx, "admin")` / `requireRole(ctx, ["admin", "manager"])` helper used at the top of every Convex mutation/query
- Reads role from the Convex `users` table (not token claims) for consistency
- Throws `ConvexError` if unauthorized — clean error handling on client

**Secrets Management:**
- Telegram bot token stored in Convex environment variables (never exposed to client)
- Clerk keys in `.env.local` for Next.js, Convex env vars for backend
- Admin UI overrides for Telegram chat ID stored in `settings` table

### API & Communication Patterns

**Convex Function Organization:**
- `convex/tasks.ts` — mutations (create, claim, complete), queries (list, getById)
- `convex/users.ts` — queries (list, getByClerkId), mutations (syncFromClerk, updateRole)
- `convex/subjects.ts` — CRUD mutations + list query
- `convex/coins.ts` — CRUD mutations + list query
- `convex/notifications.ts` — create, markRead, listUnread queries
- `convex/settings.ts` — get/set mutations for admin config
- `convex/telegram.ts` — internal action for sending messages with retry
- `convex/crons.ts` — scheduled function checks for stress test reminders

**Telegram Delivery Pattern:**
- Shared `sendTelegramMessage` internal action in `convex/telegram.ts`
- Called via `ctx.scheduler.runAfter(0, ...)` from mutations (non-blocking)
- 3 retries with exponential backoff (1s, 2s, 4s)
- On final failure: log error, task still saved in Convex (graceful degradation per NFR)
- Bot token read from Convex env var, chat ID from `settings` table with env var fallback

**Error Handling:**
- `ConvexError` with typed error codes for client-friendly messages
- Toast notifications on client for success/error feedback
- Telegram failures don't block task creation

### Frontend Architecture

**State Management: Convex only (no Redux/Zustand)**
- `useQuery()` for reactive data subscriptions (task table, notifications, user list)
- `useMutation()` for actions (create task, claim, complete, update settings)
- No client-side state library needed — Convex handles all reactive state
- Local component state only for form inputs and UI toggles

**Component Organization:**
```
components/
  ui/           # shadcn/ui components (button, input, select, toast, etc.)
  tasks/        # TaskTable, TaskRow, TaskComposeForm, TaskTypeToggle
  notifications/ # NotificationBadge, NotificationList
  admin/        # UserList, RoleAssign, SubjectManager, CoinManager, SettingsPanel
  layout/       # Navbar, Sidebar, RoleGuard
```

**Routing Strategy (App Router):**
```
app/
  (auth)/sign-in/   # Clerk sign-in
  (auth)/sign-up/   # Clerk sign-up
  (dashboard)/      # Protected layout with nav
    page.tsx        # Task table (default view)
    compose/        # Task compose form
    admin/          # Admin settings panel
      users/        # User management
      settings/     # Telegram config, subjects, coins
```

**Optimistic Updates:**
- Convex handles optimistic updates automatically for mutations
- Task claiming uses Convex's transactional guarantees for first-come-first-serve locking

### Infrastructure & Deployment

**Hosting:** Vercel (auto-deploys from main branch)
**Backend:** Convex cloud (managed, no infrastructure to maintain)
**Auth:** Clerk cloud (managed)
**Environment Config:** `.env.local` for local dev, Vercel env vars for production, Convex env vars for backend secrets

### Decision Impact Analysis

**Implementation Sequence:**
1. Project setup (Convex + Clerk + shadcn/ui installation and wiring)
2. Convex schema + users table + Clerk webhook sync
3. Auth flow (sign-in/sign-up, role guard, middleware)
4. Task dispatch (compose form + Telegram action)
5. Task lifecycle (claim/complete + Telegram messages)
6. Scheduled reminders (stress test crons)
7. Notifications system
8. Admin settings panel

**Cross-Component Dependencies:**
- Everything depends on auth + users table (step 1-3)
- Task lifecycle depends on Telegram action (step 4-5)
- Notifications depend on task mutations (step 5-7)
- Admin settings can be built independently after auth

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Convex (Database & Backend):**
- Table names: `camelCase` plural — `users`, `tasks`, `subjects`, `coins`, `notifications`, `settings`
- Field names: `camelCase` — `clerkId`, `subjectId`, `createdAt`, `isActive`
- Convex functions: `camelCase` — `tasks.create`, `tasks.claim`, `users.getByClerkId`
- Internal functions: prefix with `internal.` — `internal.telegram.sendMessage`

**Frontend (React/Next.js):**
- Components: `PascalCase` files and exports — `TaskTable.tsx`, `TaskComposeForm.tsx`
- Hooks: `camelCase` with `use` prefix — `useCurrentUser.ts`
- Utility files: `camelCase` — `formatDate.ts`, `roleGuard.ts`
- Route folders: `kebab-case` — `app/(dashboard)/admin/settings/`

**General:**
- All TypeScript, no `.js` files
- Named exports preferred over default exports (except Next.js pages)
- Barrel exports (`index.ts`) only for `components/ui/`

### Structure Patterns

**Project Organization: Feature-based with shared UI**
```
app/
  (auth)/              # Public auth routes
  (dashboard)/         # Protected routes with shared layout
    layout.tsx         # Auth check + nav + ConvexProvider
    page.tsx           # Task table (default)
    compose/page.tsx   # Task compose form
    admin/             # Admin-only routes
components/
  ui/                  # shadcn/ui primitives (auto-generated)
  tasks/               # Task-related components
  notifications/       # Notification components
  admin/               # Admin panel components
  layout/              # Shared layout components (Navbar, RoleGuard)
convex/
  schema.ts            # Single schema definition
  tasks.ts             # Task mutations + queries
  users.ts             # User sync + role management
  subjects.ts          # Subject CRUD
  coins.ts             # Coin CRUD
  notifications.ts     # Notification mutations + queries
  settings.ts          # Admin settings
  telegram.ts          # Telegram integration (internal action)
  crons.ts             # Scheduled functions
  _helpers/            # Shared backend helpers
    auth.ts            # requireRole() helper
    telegram.ts        # Message formatting helpers
lib/
  validators.ts        # Shared Zod schemas for form validation
  constants.ts         # App-wide constants (roles, task statuses, etc.)
  utils.ts             # General utility functions
```

**Co-located tests:** `*.test.ts` next to the file they test (when tests are added)

### Format Patterns

**Convex Response Format:**
- Queries return data directly (no wrapper) — Convex handles this natively
- Mutations return the created/updated document ID or void
- Errors thrown as `ConvexError({ code: "UNAUTHORIZED", message: "..." })`

**Error Codes (standardized):**
- `UNAUTHORIZED` — missing or insufficient role
- `NOT_FOUND` — resource doesn't exist
- `ALREADY_CLAIMED` — task already claimed by another user
- `VALIDATION_ERROR` — input validation failed
- `TELEGRAM_ERROR` — Telegram API failure (non-blocking)

**Date/Time:**
- Stored as Unix timestamps (`number`) in Convex
- Displayed using `Intl.DateTimeFormat` or a lightweight formatter
- Stress test start/end times stored as timestamps, displayed in user's local timezone

**Task Status Enum:**
- `"pending"` | `"claimed"` | `"done"` — string literals, not numbers

**Role Enum:**
- `"admin"` | `"manager"` | `"staff"` — lowercase string literals

### Communication Patterns

**Convex Subscriptions (Real-time):**
- Use `useQuery()` for all read operations — never fetch manually
- Task table subscribes to `tasks.list` with role-based filtering
- Notifications subscribe to `notifications.listUnread`
- All connected clients update automatically on any mutation

**Telegram Message Templates:**
- Dispatch: `"📋 {senderName} sent a {subject} task — {body}"`
- Acknowledge: `"✅ {staffName} acknowledged {senderName}'s {subject} task"`
- Complete: `"✔️ {staffName} is done with {senderName}'s {subject} task"`
- Stress test start: `"⏰ Reminder: {coin} stress test starting now — {body}"`
- Stress test end: `"🏁 Reminder: {coin} stress test ending now"`

### Process Patterns

**Error Handling:**
- Convex mutations: throw `ConvexError` with typed code + message
- Client: catch in mutation handler, show toast with error message
- Telegram failures: log error in Convex, don't throw to client (fire-and-forget)
- Auth failures: redirect to sign-in via Clerk middleware

**Loading States:**
- Use Convex's built-in `undefined` return from `useQuery()` to detect loading
- Show skeleton/spinner while query returns `undefined`
- Show empty state when query returns empty array
- No global loading state — each component manages its own

**Optimistic Locking (Task Claiming):**
- `claim` mutation checks `status === "pending"` before updating
- If already claimed, throw `ConvexError({ code: "ALREADY_CLAIMED" })`
- Convex's transactional mutations guarantee atomicity — no race conditions

### Enforcement Guidelines

**All AI Agents MUST:**
1. Use `requireRole()` helper at the top of every Convex mutation/query that needs auth
2. Follow the naming conventions above — no exceptions
3. Use `ConvexError` with standardized error codes for all error cases
4. Never expose Telegram bot token or Convex internal functions to the client
5. Use `useQuery()`/`useMutation()` from Convex — never `fetch()` for data operations
6. Place new components in the correct feature folder, not in a generic `components/` root

## Project Structure & Boundaries

### Complete Project Directory Structure

```
bot-chatter/
├── README.md
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
├── components.json              # shadcn/ui config
├── .env.local                   # Clerk keys (NEXT_PUBLIC_CLERK_*, CLERK_SECRET_KEY)
├── .env.example                 # Template for required env vars
├── .gitignore
├── public/
│   └── favicon.ico
├── app/
│   ├── globals.css              # Tailwind base + shadcn/ui theme
│   ├── layout.tsx               # Root layout: ClerkProvider + ConvexProviderWithClerk
│   ├── (auth)/
│   │   ├── sign-in/
│   │   │   └── [[...sign-in]]/
│   │   │       └── page.tsx     # Clerk SignIn component
│   │   └── sign-up/
│   │       └── [[...sign-up]]/
│   │           └── page.tsx     # Clerk SignUp component
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Protected layout: auth check, Navbar, RoleGuard
│   │   ├── page.tsx             # Task table (default view — FR13, FR21, FR23)
│   │   ├── compose/
│   │   │   └── page.tsx         # Task compose form (FR7, FR8, FR9)
│   │   └── admin/
│   │       ├── layout.tsx       # Admin role guard
│   │       ├── users/
│   │       │   └── page.tsx     # User list + role assignment (FR2, FR3, FR4)
│   │       └── settings/
│   │           └── page.tsx     # Subjects, coins, Telegram config (FR29-FR33)
│   └── api/
│       └── webhooks/
│           └── clerk/
│               └── route.ts     # Clerk webhook handler → sync users to Convex
├── components/
│   ├── ui/                      # shadcn/ui primitives (auto-generated)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── badge.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── skeleton.tsx
│   │   └── ...
│   ├── tasks/
│   │   ├── TaskTable.tsx        # Task list with status columns (FR13, FR21, FR22)
│   │   ├── TaskRow.tsx          # Single task row with claim/done actions
│   │   ├── TaskComposeForm.tsx  # Compose form with type toggle (FR7, FR8, FR9)
│   │   └── TaskTypeToggle.tsx   # Simple task / Coin stress test toggle (FR9)
│   ├── notifications/
│   │   ├── NotificationBadge.tsx  # Unread count badge (FR28)
│   │   └── NotificationList.tsx   # Notification dropdown (FR25, FR26, FR27)
│   ├── admin/
│   │   ├── UserList.tsx         # All users with role display (FR2)
│   │   ├── RoleAssign.tsx       # Role assignment dropdown (FR3, FR4)
│   │   ├── SubjectManager.tsx   # Subject CRUD (FR29)
│   │   ├── CoinManager.tsx      # Coin CRUD (FR30)
│   │   └── SettingsPanel.tsx    # Telegram config (FR31, FR32)
│   └── layout/
│       ├── Navbar.tsx           # Top nav with notification badge + user menu
│       └── RoleGuard.tsx        # Conditional render based on user role (FR6)
├── convex/
│   ├── _generated/              # Auto-generated by Convex CLI
│   ├── schema.ts                # Full schema definition (all tables)
│   ├── tasks.ts                 # create, claim, complete mutations + list, getById queries
│   ├── users.ts                 # syncFromClerk, updateRole mutations + list, getByClerkId queries
│   ├── subjects.ts              # add, update, remove mutations + list query
│   ├── coins.ts                 # add, update, remove mutations + list query
│   ├── notifications.ts         # create mutation + listUnread, markRead queries
│   ├── settings.ts              # get, set mutations for Telegram config
│   ├── telegram.ts              # sendMessage internal action with retry logic
│   ├── crons.ts                 # Scheduled functions for stress test reminders (FR19, FR20)
│   └── _helpers/
│       ├── auth.ts              # requireRole() helper
│       └── telegram.ts          # Message formatting helpers (templates)
├── lib/
│   ├── validators.ts            # Zod schemas for form validation
│   ├── constants.ts             # Roles, task statuses, task types enums
│   └── utils.ts                 # cn() helper, date formatting, etc.
└── middleware.ts                 # Clerk auth middleware (protect routes)
```

### Architectural Boundaries

**Auth Boundary:**
- `middleware.ts` — Clerk intercepts all requests, redirects unauthenticated users to `/sign-in`
- `app/(dashboard)/layout.tsx` — Checks user has a role assigned; shows "pending approval" if not
- `app/(dashboard)/admin/layout.tsx` — Checks user is admin; redirects if not
- `convex/_helpers/auth.ts` — Server-side role enforcement on every mutation/query

**Data Boundary:**
- All data access happens through Convex functions only — no direct DB access from frontend
- Frontend uses `useQuery()` / `useMutation()` exclusively
- Convex functions are the single source of truth for business logic

**External Integration Boundary:**
- `convex/telegram.ts` — Only file that makes HTTP calls to Telegram Bot API
- `app/api/webhooks/clerk/route.ts` — Only entry point for Clerk webhooks
- Both are server-side only; no external API calls from client components

### Requirements to Structure Mapping

| FR Category | Frontend | Backend | Key FRs |
|---|---|---|---|
| Auth & Users | `(auth)/`, `admin/users/`, `RoleGuard` | `convex/users.ts`, `_helpers/auth.ts` | FR1-FR6 |
| Task Dispatch | `compose/`, `TaskComposeForm` | `convex/tasks.ts` (create), `convex/telegram.ts` | FR7-FR12 |
| Task Claiming | `TaskTable`, `TaskRow` | `convex/tasks.ts` (claim, complete) | FR13-FR18 |
| Reminders | — (automated) | `convex/crons.ts`, `convex/telegram.ts` | FR19-FR20 |
| Tracking | `page.tsx` (dashboard), `TaskTable` | `convex/tasks.ts` (list queries) | FR21-FR24 |
| Notifications | `NotificationBadge`, `NotificationList` | `convex/notifications.ts` | FR25-FR28 |
| Admin Config | `admin/settings/`, `SubjectManager`, `CoinManager` | `convex/subjects.ts`, `convex/coins.ts`, `convex/settings.ts` | FR29-FR33 |

### Data Flow

```
User Action → React Component → useMutation() → Convex Mutation
  → Validates role (requireRole)
  → Updates database
  → Schedules Telegram message (runAfter)
  → Creates notification record
  → All useQuery() subscribers auto-update
  → Telegram action fires async with retry
```

### Development Workflow

**Local Development:**
- `npm run dev` — starts Next.js dev server (Turbopack)
- `npx convex dev` — starts Convex dev backend + syncs schema
- Both run concurrently; changes hot-reload instantly

**Environment Setup:**
- `.env.local` — `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CONVEX_URL`, `CLERK_WEBHOOK_SECRET`
- Convex env vars (via dashboard) — `TELEGRAM_BOT_TOKEN`
- `.env.example` — documents all required vars without values

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** All technology choices (Next.js 16, Convex, Clerk, Tailwind 4, shadcn/ui) are compatible and commonly used together. No version conflicts detected. The Convex + Clerk integration pattern (ConvexProviderWithClerk) is officially supported by both services.

**Pattern Consistency:** Naming conventions (camelCase for Convex, PascalCase for components, kebab-case for routes) align with each technology's ecosystem conventions. Error handling pattern (ConvexError with typed codes) is consistent across all Convex functions.

**Structure Alignment:** Project structure follows Next.js App Router conventions with Convex backend directory. Feature-based component organization maps cleanly to functional requirement categories. All integration points (Clerk webhook, Telegram action) have dedicated, well-bounded locations.

### Requirements Coverage

**Functional Requirements:** All 33 FRs (FR1-FR33) are mapped to specific architectural components with clear frontend and backend ownership. No orphaned requirements.

**Non-Functional Requirements:**
- Performance: Addressed via Convex real-time subscriptions, non-blocking Telegram calls, Vercel edge deployment
- Security: Addressed via Clerk middleware, requireRole() helper, server-side-only secrets
- Integration: Addressed via Telegram retry pattern, Clerk webhook sync, Convex scheduled functions
- Reliability: Addressed via Convex transactional mutations, optimistic locking, graceful degradation

### Implementation Readiness

**Decision Completeness:** All critical and important decisions are documented with rationale. Deferred decisions (testing, CI/CD, monitoring) are explicitly marked as post-MVP.

**Structure Completeness:** Full directory tree defined with every file mapped to specific FRs. Component boundaries and integration points are clearly specified.

**Pattern Completeness:** Naming, structure, format, communication, and process patterns all documented with concrete examples. Enforcement guidelines provide clear rules for AI agents.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Low)
- [x] Technical constraints identified (Convex, Clerk, Telegram, Vercel)
- [x] Cross-cutting concerns mapped (Auth, Telegram, Audit, Real-time)

**Architectural Decisions**
- [x] Critical decisions documented (role storage, schema, auth, Telegram)
- [x] Technology stack fully specified with versions
- [x] Integration patterns defined (Clerk webhook, Telegram retry, Convex subscriptions)
- [x] Performance considerations addressed (non-blocking, real-time, transactional)

**Implementation Patterns**
- [x] Naming conventions established (Convex, React, routes)
- [x] Structure patterns defined (feature-based, co-located tests)
- [x] Communication patterns specified (subscriptions, Telegram templates, error codes)
- [x] Process patterns documented (error handling, loading states, optimistic locking)

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established (auth, data, external integration)
- [x] Integration points mapped (webhook, Telegram, Convex)
- [x] Requirements to structure mapping complete (all 33 FRs)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — low complexity project with well-established technology patterns and all managed services.

**Key Strengths:**
- Zero infrastructure to maintain (Convex, Clerk, Vercel all managed)
- Real-time by default via Convex subscriptions
- Clear separation: Convex handles all business logic, Next.js handles UI, Clerk handles auth
- Every FR maps to a specific file location

**Areas for Future Enhancement:**
- Add testing framework when codebase grows
- Add CI/CD pipeline for automated deployments
- Consider Convex Ents for relational query patterns if data access becomes complex
- Add monitoring/alerting if Telegram delivery reliability becomes a concern

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

**First Implementation Priority:**
Install Convex, Clerk, and shadcn/ui into the existing Next.js project, wire up providers in root layout, configure Clerk middleware, and deploy initial Convex schema.
