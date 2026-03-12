# Story 3.1: Staff Task View & Claiming

Status: review

## Story

As a staff member,
I want to view pending tasks and claim one with a single action,
so that I can take ownership of work and notify the team.

## Acceptance Criteria

1. Authenticated staff member sees a table of all pending (unclaimed) tasks with columns: subject, body, sender name, created time (FR13)
2. Staff can click a "Claim" button to claim a pending task (FR14)
3. Claiming sets task status to `"claimed"` with `claimedBy` (user ID) and `claimedAt` (timestamp)
4. A Telegram message is sent: `✅ [Staff Name] acknowledged [Sender Name] [Subject]` (FR16)
5. If two staff claim simultaneously, only the first succeeds; the second gets `ALREADY_CLAIMED` error (FR15, NFR17)
6. Optimistic locking via Convex transactional mutation prevents race conditions
7. Non-staff users are denied access via `requireRole('staff')`

## Tasks / Subtasks

- [x] Create pending tasks query (AC: #1)
  - [x] In `convex/tasks.ts`, add `listPending` query filtering `status === "pending"`
  - [x] Use `by_status` index for efficient querying
  - [x] Require staff role via `requireRole(ctx, ["staff", "manager", "admin"])`
  - [x] Return: subject, body, senderName, createdAt, _id
- [x] Create claim task mutation (AC: #2, #3, #5, #6)
  - [x] In `convex/tasks.ts`, add `claim` mutation accepting `taskId`
  - [x] Require staff role via `requireRole(ctx, ["staff", "manager", "admin"])`
  - [x] Read task by ID, verify `status === "pending"` (if not, throw `ALREADY_CLAIMED` ConvexError)
  - [x] Update task: `status: "claimed"`, `claimedBy: userId`, `claimedAt: Date.now()`
  - [x] Convex mutations are transactional — automatic optimistic locking
  - [x] Schedule Telegram message: `✅ ${staffName} acknowledged ${senderName} ${subject}` (AC: #4)
- [x] Build staff tasks page (AC: #1, #7)
  - [x] Create `app/(dashboard)/page.tsx` as default dashboard view
  - [x] Use `useQuery(api.tasks.listPending)` for reactive data
  - [x] Gate access with role check via role-based view switching
- [x] Build PendingTaskTable component (AC: #1, #2)
  - [x] Create `components/tasks/PendingTaskTable.tsx` using shadcn/ui Table
  - [x] Columns: Subject, Body (truncated to 50 chars), Sender, Created, Actions
  - [x] "Claim" button in Actions column for each pending task
  - [x] On claim: call `useMutation(api.tasks.claim)` with task ID
  - [x] Show error toast if `ALREADY_CLAIMED`
  - [x] Table updates reactively via Convex subscription (no manual refresh)

## Dev Notes

- **Convex transactional guarantees:** Mutations are automatically serializable. If two `claim` mutations run for the same task, Convex will serialize them — the first sets `status: "claimed"`, the second reads the updated status and throws `ALREADY_CLAIMED`. No manual locking needed.
- **Error handling pattern:** Use `ConvexError` with `{ code: "ALREADY_CLAIMED", message: "Task already claimed" }`. On client, catch in mutation error handler and show toast.
- **Default dashboard:** The staff task view can be the default `app/(dashboard)/page.tsx` since staff will visit this most frequently. Managers/admins get a different view (Story 3.3).
- **Reactive updates:** `useQuery` automatically re-renders when tasks change. When a task is claimed by anyone, it disappears from the pending list for all connected staff.

### Project Structure Notes

```
app/(dashboard)/
  page.tsx                    # Default view - staff sees pending tasks, managers see dashboard
convex/
  tasks.ts                    # Add listPending query, claim mutation
components/
  tasks/
    PendingTaskTable.tsx      # Pending task table component
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Convex function organization, error handling
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — State management with useQuery/useMutation
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md] — FR13, FR14, FR15, FR16, NFR17

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6
### Debug Log References
N/A
### Completion Notes List
- Extended requireRole to allow staff, manager, and admin roles (not just staff) per implementation instructions
- Installed shadcn tabs component for dashboard tab navigation
- PendingTaskTable shows error toast on ALREADY_CLAIMED ConvexError
- Dashboard page uses role-based view switching (staff vs manager/admin)
### File List
- convex/tasks.ts (listPending query, claim mutation)
- components/tasks/PendingTaskTable.tsx
- app/(dashboard)/page.tsx
- components/ui/tabs.tsx (shadcn install)
