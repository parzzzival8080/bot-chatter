# Story 5.1: In-App Notification System

Status: review

## Story

As a user,
I want to receive in-app notifications for task events relevant to my role,
so that I stay informed without needing to check Telegram.

## Acceptance Criteria

1. When a new task is dispatched, in-app notifications are created for all staff users (FR25)
2. The `notifications` table has fields: `userId`, `type`, `message`, `taskId`, `isRead`, `createdAt`
3. When a staff member claims a task, notifications are created for all manager and admin users (FR26)
4. When a staff member marks a task as done, notifications are created for all manager and admin users (FR27)
5. A notification badge in the app header displays the count of unread notifications (FR28)
6. Users can view their notifications ordered by most recent
7. Users can mark notifications as read (individually or all at once), and the badge updates accordingly

## Tasks / Subtasks

- [x] Create notifications table in schema (AC: #2)
  - [x] In `convex/schema.ts`, add `notifications` table:
    - `userId` (v.id("users")), `type` (v.string()), `message` (v.string()), `taskId` (v.id("tasks")), `isRead` (v.boolean()), `createdAt` (v.number())
  - [x] Add indexes: `.index("by_userId", ["userId"])`, `.index("by_userId_isRead", ["userId", "isRead"])`
- [x] Create notification helper function (AC: #1, #3, #4)
  - [x] In `convex/notifications.ts`, create `createForRole` internal mutation
  - [x] Accepts: `role` (or array of roles), `type`, `message`, `taskId`
  - [x] Queries `users` table for all users with matching role(s)
  - [x] Creates a notification record for each matching user
- [x] Integrate notifications into task mutations (AC: #1, #3, #4)
  - [x] In `convex/tasks.ts` `create` mutation: after saving task, call `createForRole` for staff users with type `"task_dispatched"`
  - [x] In `convex/tasks.ts` `claim` mutation: call `createForRole` for admin + manager users with type `"task_claimed"`
  - [x] In `convex/tasks.ts` `complete` mutation: call `createForRole` for admin + manager users with type `"task_completed"`
- [x] Create notification queries (AC: #5, #6)
  - [x] In `convex/notifications.ts`, add `listForUser` query — returns current user's notifications ordered by `createdAt` desc
  - [x] Add `countUnread` query — returns count of `isRead: false` for current user
  - [x] Both use `by_userId` index
- [x] Create notification mutations (AC: #7)
  - [x] In `convex/notifications.ts`, add `markAsRead` mutation — sets `isRead: true` for a single notification
  - [x] Add `markAllAsRead` mutation — sets `isRead: true` for all of current user's unread notifications
- [x] Build NotificationBadge component (AC: #5)
  - [x] Create `components/notifications/NotificationBadge.tsx`
  - [x] Use `useQuery(api.notifications.countUnread)` for reactive count
  - [x] Display badge with count on bell icon in Navbar
  - [x] Badge hidden when count is 0
- [x] Build NotificationList component (AC: #6, #7)
  - [x] Create `components/notifications/NotificationList.tsx`
  - [x] Use `useQuery(api.notifications.listForUser)` for reactive list
  - [x] Show as dropdown/popover from the bell icon in Navbar
  - [x] Each notification shows: type icon, message, timestamp, read/unread state
  - [x] Click to mark individual as read
  - [x] "Mark all as read" button at top
- [x] Integrate into Navbar (AC: #5)
  - [x] Add NotificationBadge + NotificationList to `components/layout/Navbar.tsx`
  - [x] Bell icon with badge count, click to open notification dropdown

## Dev Notes

- **Notification creation pattern:** Use `ctx.scheduler.runAfter(0, internal.notifications.createForRole, {...})` from task mutations to avoid blocking the main mutation. Or call directly as internal mutation if performance is acceptable.
- **Batch creation:** When creating notifications for multiple users, batch the inserts. Convex mutations are transactional, so inserting 10 notifications in one mutation is fine.
- **Notification types:** `"task_dispatched"`, `"task_claimed"`, `"task_completed"` — use these for type-specific icons and messaging.
- **Real-time badge:** `useQuery(api.notifications.countUnread)` automatically updates when new notifications are created or marked as read. No polling needed.
- **Popover component:** Use shadcn/ui Popover or DropdownMenu for the notification dropdown. Install: `npx shadcn@latest add popover`.

### Project Structure Notes

```
convex/
  schema.ts                        # Add notifications table
  notifications.ts                 # Queries, mutations, createForRole helper
  tasks.ts                         # Update create/claim/complete to trigger notifications
components/
  notifications/
    NotificationBadge.tsx          # Bell icon with unread count
    NotificationList.tsx           # Notification dropdown list
  layout/
    Navbar.tsx                     # Add notification bell to navbar
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Notifications table schema
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Convex function organization
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md] — FR25, FR26, FR27, FR28

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
N/A

### Completion Notes List
- Added `notifications` table to `convex/schema.ts` with `by_userId` and `by_userId_isRead` indexes
- Created `convex/notifications.ts` with: `createForRole` (internalMutation), `listForUser` (query), `countUnread` (query), `markAsRead` (mutation), `markAllAsRead` (mutation)
- Updated `convex/tasks.ts` — `create`, `claim`, and `complete` mutations now schedule `createForRole` via `ctx.scheduler.runAfter(0, ...)` to create role-based notifications
- Created `components/notifications/NotificationBadge.tsx` — Bell icon with red unread count badge, toggles popover
- Created `components/notifications/NotificationList.tsx` — Notification list with type-specific icons (ClipboardList/UserCheck/CheckCircle), relative timestamps, mark-as-read on click, "Mark all as read" button
- Installed shadcn popover component (`components/ui/popover.tsx`)
- Integrated `NotificationBadge` into `components/layout/Navbar.tsx` before `UserButton`

### File List
- convex/schema.ts (modified)
- convex/notifications.ts (new)
- convex/tasks.ts (modified)
- components/notifications/NotificationBadge.tsx (new)
- components/notifications/NotificationList.tsx (new)
- components/ui/popover.tsx (new, via shadcn)
- components/layout/Navbar.tsx (modified)
