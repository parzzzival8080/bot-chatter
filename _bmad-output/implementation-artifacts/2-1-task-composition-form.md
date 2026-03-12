# Story 2.1: Task Composition Form

Status: review

## Story

As a manager or admin,
I want to compose a task by selecting a subject and entering details,
so that I can dispatch work instructions to my team.

## Acceptance Criteria

1. Authenticated manager/admin navigating to task dispatch page sees a form with subject dropdown and body message input (FR7)
2. A toggle switches between "Simple Task" and "Coin Stress Test" mode (FR9)
3. In Simple Task mode: subject dropdown + body message, validated with Zod
4. In Coin Stress Test mode: additional coin dropdown, start time picker, end time picker (FR8), all required, end time must be after start time
5. Convex schema creates `tasks` table with fields: `type`, `subject`, `body`, `coin`, `startTime`, `endTime`, `status`, `senderId`, `senderName`, `claimedBy`, `claimedAt`, `completedAt`, `createdAt`
6. Convex schema creates `subjects` table with fields: `name`, `isActive`, `createdAt`
7. Convex schema creates `coins` table with fields: `name`, `isActive`, `createdAt`
8. Initial seed subjects are available in the dropdown
9. Non-manager/non-admin users are denied access via `requireRole('manager', 'admin')`

## Tasks / Subtasks

- [x] Define Convex schema for tasks, subjects, coins (AC: #5, #6, #7)
  - [x] In `convex/schema.ts`, add `tasks` table with all fields and indexes: `by_status` on `["status"]`, `by_senderId` on `["senderId"]`, `by_claimedBy` on `["claimedBy"]`
  - [x] Add `subjects` table with `name` (string), `isActive` (boolean), `createdAt` (number)
  - [x] Add `coins` table with `name` (string), `isActive` (boolean), `createdAt` (number)
- [x] Create subjects/coins queries and seed data (AC: #8)
  - [x] Create `convex/subjects.ts` with `listActive` query (returns subjects where `isActive: true`)
  - [x] Create `convex/coins.ts` with `listActive` query
  - [x] Create `convex/seed.ts` with seed function to populate initial subjects (e.g., "General", "Urgent", "Follow-up")
  - [x] Run seed on first deploy or provide manual seed script
- [x] Create task compose form page (AC: #1, #9)
  - [x] Create `app/(dashboard)/compose/page.tsx`
  - [x] Gate with `requireRole(['admin', 'manager'])` check in component
  - [x] Use shadcn/ui components: Select, Input, Textarea, Button, Switch/Toggle
- [x] Build TaskComposeForm component (AC: #1, #2, #3, #4)
  - [x] Create `components/tasks/TaskComposeForm.tsx`
  - [x] State: `taskType` ("simple" | "stressTest"), form fields
  - [x] Toggle component to switch between simple and stress test mode
  - [x] Simple mode: subject Select + body Textarea
  - [x] Stress test mode: + coin Select + startTime DateTimePicker + endTime DateTimePicker
  - [x] Zod validation schema for both modes
  - [x] Form submission calls task creation mutation
- [x] Create Zod validation schemas (AC: #3, #4)
  - [x] Create `lib/validations/task.ts` with `simpleTaskSchema` and `stressTestTaskSchema`
  - [x] Simple: `{ subject: z.string().min(1), body: z.string().min(1) }`
  - [x] Stress test: extends simple + `{ coin: z.string().min(1), startTime: z.number(), endTime: z.number() }` with `.refine(endTime > startTime)`
- [x] Create task creation mutation (AC: #5)
  - [x] In `convex/tasks.ts`, create `create` mutation with Convex argument validators
  - [x] Validate role with `requireRole(ctx, ["admin", "manager"])`
  - [x] Save task with `status: "pending"`, `senderId`, `senderName`, `createdAt: Date.now()`
  - [x] Return task ID (Telegram dispatch is Story 2.2)

## Dev Notes

- **Task type field:** Use `v.union(v.literal("simple"), v.literal("stressTest"))` in Convex schema
- **Optional fields:** `coin`, `startTime`, `endTime`, `claimedBy`, `claimedAt`, `completedAt` should use `v.optional()` in schema
- **Status field:** `v.union(v.literal("pending"), v.literal("claimed"), v.literal("done"))`
- **DateTime picker:** Use a shadcn/ui compatible date-time picker. Consider `react-day-picker` or a simple `<input type="datetime-local" />` styled with shadcn
- **Seed data approach:** Create a Convex mutation that checks if subjects exist before seeding. Can be run manually from Convex dashboard or via a one-time script.
- **Subject/coin display:** Show only `isActive: true` items in dropdowns

### Project Structure Notes

```
app/(dashboard)/compose/page.tsx        # Task compose page
convex/
  schema.ts                              # Add tasks, subjects, coins tables
  tasks.ts                               # create mutation
  subjects.ts                            # listActive query
  coins.ts                               # listActive query
  seed.ts                                # Seed data function
components/
  tasks/
    TaskComposeForm.tsx                  # Main compose form
lib/
  validations/
    task.ts                              # Zod schemas
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Schema design, field types
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Convex function organization
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md] — FR7, FR8, FR9

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
N/A

### Completion Notes List
- Schema extended with tasks, subjects, coins tables (settings added in 2.2)
- Seed mutation checks for existing data before inserting to avoid duplicates
- Zod v4 used (installed as latest); uses `message` param instead of `required_error`
- DateTime inputs use native `<input type="datetime-local" />` styled with shadcn Input component
- Switch component from shadcn/base-ui used for task type toggle
- Client-side role check in compose page denies non-manager/non-admin users
- Server-side role check via requireRole in create mutation

### File List
- convex/schema.ts
- convex/tasks.ts
- convex/subjects.ts
- convex/coins.ts
- convex/seed.ts
- app/(dashboard)/compose/page.tsx
- components/tasks/TaskComposeForm.tsx
- lib/validations/task.ts
