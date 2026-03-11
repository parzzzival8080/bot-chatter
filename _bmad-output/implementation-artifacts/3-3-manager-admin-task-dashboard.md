# Story 3.3: Manager/Admin Task Dashboard

Status: ready-for-dev

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

- [ ] Create all-tasks query (AC: #1, #4)
  - [ ] In `convex/tasks.ts`, add `listAll` query returning all tasks
  - [ ] Require manager or admin role via `requireRole(ctx, ["admin", "manager"])`
  - [ ] Include all fields: subject, body, type, senderName, status, claimedBy (resolve to user name), claimedAt, completedAt, createdAt
  - [ ] Order by `createdAt` descending (newest first)
- [ ] Resolve claimer names (AC: #1)
  - [ ] In `listAll` query, look up claimer user name from `users` table when `claimedBy` is set
  - [ ] Return `claimerName` alongside `claimedBy` ID
- [ ] Build manager/admin dashboard page (AC: #1, #4)
  - [ ] Update `app/(dashboard)/page.tsx` to show different views based on role
  - [ ] Staff: pending tasks + my tasks (from Stories 3.1/3.2)
  - [ ] Manager/Admin: all-tasks dashboard
  - [ ] Alternatively, create separate route `app/(dashboard)/dashboard/page.tsx`
- [ ] Build AdminTaskTable component (AC: #1, #2, #3)
  - [ ] Create `components/tasks/AdminTaskTable.tsx` using shadcn/ui Table
  - [ ] Columns: Subject, Body (truncated), Type (badge), Sender, Status (badge), Claimed By, Created, Claimed At, Completed At
  - [ ] Status badges: pending (yellow), claimed (blue), done (green)
  - [ ] Type badges: simple (default), stressTest (purple)
  - [ ] Use `useQuery(api.tasks.listAll)` for reactive real-time updates (AC: #2)
- [ ] Performance optimization for 500 tasks (AC: #3)
  - [ ] Use pagination or virtual scrolling if table becomes slow
  - [ ] Consider `usePaginatedQuery` from Convex for large datasets
  - [ ] Alternatively, add status filter tabs (All / Pending / Claimed / Done) to reduce rendered rows
- [ ] Add status filter controls (AC: #1)
  - [ ] Add filter dropdown or tabs above table to filter by status
  - [ ] Client-side filtering from the reactive query result

## Dev Notes

- **Real-time updates:** `useQuery(api.tasks.listAll)` automatically re-renders when any task changes. Convex subscriptions handle this — no WebSocket setup needed.
- **Performance at 500 tasks:** Convex queries are fast, but rendering 500 rows may need attention. Options: (1) pagination with `usePaginatedQuery`, (2) virtual scrolling with `@tanstack/react-virtual`, (3) status filter tabs to show fewer rows at once. Start simple, optimize if needed.
- **Role-based default view:** The main dashboard page should check the user's role and render the appropriate component (staff view vs manager/admin view).
- **Timestamp formatting:** Use a utility like `date-fns` or native `Intl.DateTimeFormat` for clean timestamp display.
- **Claimer name resolution:** Can either join in the query or pass `claimedBy` user ID and resolve client-side. Query-side join is cleaner.

### Project Structure Notes

```
app/(dashboard)/
  page.tsx                        # Role-based view switching
components/
  tasks/
    AdminTaskTable.tsx            # Manager/admin all-tasks table
    StatusFilter.tsx              # Status filter tabs/dropdown
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
### Debug Log References
### Completion Notes List
### File List
