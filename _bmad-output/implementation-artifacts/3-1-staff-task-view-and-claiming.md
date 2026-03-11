# Story 3.1: Staff Task View & Claiming

Status: ready-for-dev

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

- [ ] Create pending tasks query (AC: #1)
  - [ ] In `convex/tasks.ts`, add `listPending` query filtering `status === "pending"`
  - [ ] Use `by_status` index for efficient querying
  - [ ] Require staff role via `requireRole(ctx, "staff")`
  - [ ] Return: subject, body, senderName, createdAt, _id
- [ ] Create claim task mutation (AC: #2, #3, #5, #6)
  - [ ] In `convex/tasks.ts`, add `claim` mutation accepting `taskId`
  - [ ] Require staff role via `requireRole(ctx, "staff")`
  - [ ] Read task by ID, verify `status === "pending"` (if not, throw `ALREADY_CLAIMED` ConvexError)
  - [ ] Update task: `status: "claimed"`, `claimedBy: userId`, `claimedAt: Date.now()`
  - [ ] Convex mutations are transactional — automatic optimistic locking
  - [ ] Schedule Telegram message: `✅ ${staffName} acknowledged ${senderName} ${subject}` (AC: #4)
- [ ] Build staff tasks page (AC: #1, #7)
  - [ ] Create `app/(dashboard)/page.tsx` as default dashboard view (or dedicated `/tasks` route)
  - [ ] Use `useQuery(api.tasks.listPending)` for reactive data
  - [ ] Gate access with staff role check
- [ ] Build TaskTable component (AC: #1, #2)
  - [ ] Create `components/tasks/TaskTable.tsx` using shadcn/ui Table
  - [ ] Columns: Subject, Body (truncated), Sender, Created, Actions
  - [ ] "Claim" button in Actions column for each pending task
  - [ ] On claim: call `useMutation(api.tasks.claim)` with task ID
  - [ ] Show error toast if `ALREADY_CLAIMED`
  - [ ] Table updates reactively via Convex subscription (no manual refresh)

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
    TaskTable.tsx             # Reusable task table component
    TaskRow.tsx               # Individual task row (optional)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Convex function organization, error handling
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — State management with useQuery/useMutation
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md] — FR13, FR14, FR15, FR16, NFR17

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
