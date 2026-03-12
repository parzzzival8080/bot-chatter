# Story 3.2: Task Completion

Status: review

## Story

As a staff member,
I want to mark my claimed tasks as done,
so that the team knows the work is finished.

## Acceptance Criteria

1. Staff can click "Mark Done" on a task they have claimed (FR17)
2. Task status changes to `"done"` with `completedAt` timestamp
3. A Telegram message is sent: `🎉 [Staff Name] is done with the [Sender Name] [Subject] task` (FR18)
4. Staff can view their own claimed and completed tasks in a filtered table (FR24)
5. A staff member cannot mark done a task they did not claim (only the claimer can complete)

## Tasks / Subtasks

- [x] Create complete task mutation (AC: #1, #2, #3, #5)
  - [x] In `convex/tasks.ts`, add `complete` mutation accepting `taskId`
  - [x] Require staff role via `requireRole(ctx, ["staff", "manager", "admin"])`
  - [x] Read task by ID, verify `status === "claimed"` and `claimedBy === currentUserId`
  - [x] If not claimer: throw `ConvexError({ code: "UNAUTHORIZED", message: "Only the claimer can complete this task" })`
  - [x] Update task: `status: "done"`, `completedAt: Date.now()`
  - [x] Schedule Telegram message: `🎉 ${staffName} is done with the ${senderName} ${subject} task`
- [x] Create my-tasks query (AC: #4)
  - [x] In `convex/tasks.ts`, add `listMyTasks` query
  - [x] Filter tasks where `claimedBy === currentUserId`
  - [x] Use `by_claimedBy` index
  - [x] Return both claimed and done tasks for the current user
  - [x] Require staff role via `requireRole(ctx, ["staff", "manager", "admin"])`
- [x] Build MyTasks component (AC: #4)
  - [x] Create `components/tasks/MyTasks.tsx` component
  - [x] Use `useQuery(api.tasks.listMyTasks)` for reactive data
  - [x] Show table with columns: Subject, Body, Status (badge: claimed=secondary, done=default), Claimed At, Completed At, Actions
  - [x] "Mark Done" button for claimed tasks only
  - [x] Success toast on completion, error toast on unauthorized
- [x] Update dashboard page (AC: #4)
  - [x] In `app/(dashboard)/page.tsx`, add shadcn Tabs for staff: "Pending Tasks" and "My Tasks"

## Dev Notes

- **Claimer-only completion:** The mutation must verify that the requesting user's ID matches the task's `claimedBy` field. This prevents staff from completing each other's tasks.
- **Status badge styling:** Use shadcn/ui Badge with variants: `pending` (outline), `claimed` (secondary), `done` (default).
- **Dashboard tabs:** The staff dashboard page can have two tabs/views: "Pending Tasks" (from Story 3.1) and "My Tasks". Use shadcn/ui Tabs component.
- **Telegram message format:** Must exactly match: `🎉 [Staff Name] is done with the [Sender Name] [Subject] task`

### Project Structure Notes

```
convex/
  tasks.ts                    # Add complete mutation, listMyTasks query
components/
  tasks/
    MyTasks.tsx               # Staff's own tasks view
app/(dashboard)/
  page.tsx                    # Add tabs for Pending / My Tasks
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Telegram delivery pattern
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md] — FR17, FR18, FR24

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6
### Debug Log References
N/A
### Completion Notes List
- complete mutation validates both status=claimed and claimedBy match before allowing completion
- MyTasks component shows badge with secondary variant for claimed, default for done
- Staff dashboard uses shadcn Tabs with "Pending Tasks" and "My Tasks" tabs
### File List
- convex/tasks.ts (complete mutation, listMyTasks query)
- components/tasks/MyTasks.tsx
- app/(dashboard)/page.tsx
