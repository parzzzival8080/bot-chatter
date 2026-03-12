# Story 3.3: Manager/Admin Task Dashboard

Status: review

## Story

As a manager or admin,
I want to see all tasks with their current status, claimer, and timestamps,
so that I can monitor team progress in real-time.

## Acceptance Criteria

1. Manager/admin sees a table of all tasks with columns: subject, body, type, sender, status (pending/claimed/done), claimed by, and timestamps for each state change (FR21, FR22)
2. When a task's status changes, the table updates in real-time without page refresh via Convex subscription (FR23, NFR2)
3. Table handles up to 500 tasks smoothly (NFR4)
4. Non-manager/non-admin users are denied access via `requireRole('manager', 'admin')`

## Tasks / Subtasks

- [x] Create all-tasks query (AC: #1, #4)
  - [x] In `convex/tasks.ts`, add `listAll` query returning all tasks
  - [x] Require manager or admin role via `requireRole(ctx, ["admin", "manager"])`
  - [x] Include all fields: subject, body, type, senderName, status, claimedBy (resolve to user name), claimedAt, completedAt, createdAt
  - [x] Order by `createdAt` descending (newest first)
- [x] Resolve claimer names (AC: #1)
  - [x] In `listAll` query, look up claimer user name from `users` table when `claimedBy` is set
  - [x] Return `claimerName` alongside `claimedBy` ID
- [x] Build manager/admin dashboard page (AC: #1, #4)
  - [x] Update `app/(dashboard)/page.tsx` to show different views based on role
  - [x] Staff: pending tasks + my tasks (from Stories 3.1/3.2)
  - [x] Manager/Admin: all-tasks dashboard with AdminTaskTable
- [x] Build AdminTaskTable component (AC: #1, #2, #3)
  - [x] Create `components/tasks/AdminTaskTable.tsx` using shadcn/ui Table
  - [x] Columns: Subject, Body (truncated), Type (badge), Sender, Status (badge), Claimed By, Created, Claimed At, Completed At
  - [x] Status badges: pending (outline), claimed (secondary), done (default)
  - [x] Type badges: simple (default), stressTest (secondary)
  - [x] Use `useQuery(api.tasks.listAll)` for reactive real-time updates (AC: #2)
- [x] Add status filter controls (AC: #1)
  - [x] Add filter tabs above table to filter by status (All/Pending/Claimed/Done)
  - [x] Client-side filtering from the reactive query result
  - [x] Show count per status in tab labels

## Dev Notes

- **Real-time updates:** `useQuery(api.tasks.listAll)` automatically re-renders when any task changes. Convex subscriptions handle this — no WebSocket setup needed.
- **Performance at 500 tasks:** Convex queries are fast, but rendering 500 rows may need attention. Options: (1) pagination with `usePaginatedQuery`, (2) virtual scrolling with `@tanstack/react-virtual`, (3) status filter tabs to show fewer rows at once. Start simple, optimize if needed.
- **Role-based default view:** The main dashboard page should check the user's role and render the appropriate component (staff view vs manager/admin view).
- **Timestamp formatting:** Use native `Date.toLocaleString()` for clean timestamp display.
- **Claimer name resolution:** Resolved query-side by looking up user from users table when claimedBy is set.

### Project Structure Notes

```
app/(dashboard)/
  page.tsx                        # Role-based view switching
components/
  tasks/
    AdminTaskTable.tsx            # Manager/admin all-tasks table with status filter tabs
convex/
  tasks.ts                        # Add listAll query
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — State management, Convex subscriptions
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Task schema fields
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md] — FR21, FR22, FR23, NFR2, NFR4

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6
### Debug Log References
N/A
### Completion Notes List
- listAll query resolves claimer names server-side via user lookup
- AdminTaskTable uses shadcn Tabs for status filtering with counts in labels
- Client-side filtering keeps reactive updates working smoothly
- Dashboard page checks user role via getCurrentUser to render staff vs admin view
### File List
- convex/tasks.ts (listAll query)
- components/tasks/AdminTaskTable.tsx
- app/(dashboard)/page.tsx
