# Story 5.1: In-App Notification System

Status: ready-for-dev

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

- [ ] Create notifications table in schema (AC: #2)
  - [ ] In `convex/schema.ts`, add `notifications` table:
    - `userId` (v.id("users")), `type` (v.string()), `message` (v.string()), `taskId` (v.id("tasks")), `isRead` (v.boolean()), `createdAt` (v.number())
  - [ ] Add indexes: `.index("by_userId", ["userId"])`, `.index("by_userId_isRead", ["userId", "isRead"])`
- [ ] Create notification helper function (AC: #1, #3, #4)
  - [ ] In `convex/notifications.ts`, create `createForRole` internal mutation
  - [ ] Accepts: `role` (or array of roles), `type`, `message`, `taskId`
  - [ ] Queries `users` table for all users with matching role(s)
  - [ ] Creates a notification record for each matching user
- [ ] Integrate notifications into task mutations (AC: #1, #3, #4)
  - [ ] In `convex/tasks.ts` `create` mutation: after saving task, call `createForRole` for staff users with type `"task_dispatched"`
  - [ ] In `convex/tasks.ts` `claim` mutation: call `createForRole` for admin + manager users with type `"task_claimed"`
  - [ ] In `convex/tasks.ts` `complete` mutation: call `createForRole` for admin + manager users with type `"task_completed"`
- [ ] Create notification queries (AC: #5, #6)
  - [ ] In `convex/notifications.ts`, add `listForUser` query — returns current user's notifications ordered by `createdAt` desc
  - [ ] Add `countUnread` query — returns count of `isRead: false` for current user
  - [ ] Both use `by_userId` index
- [ ] Create notification mutations (AC: #7)
  - [ ] In `convex/notifications.ts`, add `markAsRead` mutation — sets `isRead: true` for a single notification
  - [ ] Add `markAllAsRead` mutation — sets `isRead: true` for all of current user's unread notifications
- [ ] Build NotificationBadge component (AC: #5)
  - [ ] Create `components/notifications/NotificationBadge.tsx`
  - [ ] Use `useQuery(api.notifications.countUnread)` for reactive count
  - [ ] Display badge with count on bell icon in Navbar
  - [ ] Badge hidden when count is 0
- [ ] Build NotificationList component (AC: #6, #7)
  - [ ] Create `components/notifications/NotificationList.tsx`
  - [ ] Use `useQuery(api.notifications.listForUser)` for reactive list
  - [ ] Show as dropdown/popover from the bell icon in Navbar
  - [ ] Each notification shows: type icon, message, timestamp, read/unread state
  - [ ] Click to mark individual as read
  - [ ] "Mark all as read" button at top
- [ ] Integrate into Navbar (AC: #5)
  - [ ] Add NotificationBadge + NotificationList to `components/layout/Navbar.tsx`
  - [ ] Bell icon with badge count, click to open notification dropdown

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
### Debug Log References
### Completion Notes List
### File List
