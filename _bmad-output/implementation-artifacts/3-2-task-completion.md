# Story 3.2: Task Completion

Status: ready-for-dev

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

- [ ] Create complete task mutation (AC: #1, #2, #3, #5)
  - [ ] In `convex/tasks.ts`, add `complete` mutation accepting `taskId`
  - [ ] Require staff role via `requireRole(ctx, "staff")`
  - [ ] Read task by ID, verify `status === "claimed"` and `claimedBy === currentUserId`
  - [ ] If not claimer: throw `ConvexError({ code: "UNAUTHORIZED", message: "Only the claimer can complete this task" })`
  - [ ] Update task: `status: "done"`, `completedAt: Date.now()`
  - [ ] Schedule Telegram message: `🎉 ${staffName} is done with the ${senderName} ${subject} task`
- [ ] Create my-tasks query (AC: #4)
  - [ ] In `convex/tasks.ts`, add `listMyTasks` query
  - [ ] Filter tasks where `claimedBy === currentUserId`
  - [ ] Use `by_claimedBy` index
  - [ ] Return both claimed and done tasks for the current user
  - [ ] Require staff role
- [ ] Update TaskTable for completion actions (AC: #1)
  - [ ] In `TaskTable.tsx`, add "Mark Done" button for tasks with `status === "claimed"` and `claimedBy === currentUser`
  - [ ] Disable button / hide for tasks claimed by others
  - [ ] On click: call `useMutation(api.tasks.complete)`
  - [ ] Show success toast on completion
- [ ] Build My Tasks view (AC: #4)
  - [ ] Create `components/tasks/MyTasks.tsx` component
  - [ ] Use `useQuery(api.tasks.listMyTasks)` for reactive data
  - [ ] Show table with columns: Subject, Body, Status (claimed/done), Claimed At, Completed At
  - [ ] Add tab or toggle on staff dashboard to switch between "Pending Tasks" and "My Tasks"

## Dev Notes

- **Claimer-only completion:** The mutation must verify that the requesting user's ID matches the task's `claimedBy` field. This prevents staff from completing each other's tasks.
- **Status badge styling:** Use shadcn/ui Badge with variants: `pending` (yellow), `claimed` (blue), `done` (green).
- **Dashboard tabs:** The staff dashboard page can have two tabs/views: "Pending Tasks" (from Story 3.1) and "My Tasks". Use shadcn/ui Tabs component.
- **Telegram message format:** Must exactly match: `🎉 [Staff Name] is done with the [Sender Name] [Subject] task`

### Project Structure Notes

```
convex/
  tasks.ts                    # Add complete mutation, listMyTasks query
components/
  tasks/
    TaskTable.tsx             # Add "Mark Done" button for claimed tasks
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
### Debug Log References
### Completion Notes List
### File List
