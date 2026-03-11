# Story 1.3: Admin Role Management

Status: ready-for-dev

## Story

As an admin,
I want to view all users and assign or change their roles,
so that I can control who has access to which features.

## Acceptance Criteria

1. Admin navigating to user management page sees a table of all registered users with columns: name, email, current role, and actions (FR2)
2. Admin can assign a role (Admin, Manager, or Staff) to a user with no role via dropdown (FR3)
3. The `requireRole()` helper enforces the new role on subsequent requests
4. Admin can change a user's existing role to a different value (FR4)
5. Role changes sync to both Convex `users` table and Clerk `publicMetadata.role`
6. Clerk `user.updated` webhook syncs the change back
7. Non-admin users are denied access at both UI (redirect) and API (`requireRole()` throws UNAUTHORIZED) levels (FR6, NFR8)

## Tasks / Subtasks

- [ ] Create admin user list query (AC: #1)
  - [ ] In `convex/users.ts`, add `list` query returning all users (requires admin role via `requireRole`)
  - [ ] Return fields: `_id`, `name`, `email`, `role`, `createdAt`
- [ ] Create role update mutation (AC: #2, #4, #5)
  - [ ] In `convex/users.ts`, add `updateRole` mutation accepting `userId` and `role`
  - [ ] Validate role is one of: `"admin"`, `"manager"`, `"staff"`
  - [ ] Update Convex `users` table with new role
  - [ ] Call Clerk Backend API to update `publicMetadata.role` via Convex action
  - [ ] Create `convex/clerkAdmin.ts` internal action that uses Clerk Backend SDK to set `publicMetadata`
- [ ] Build admin user management page (AC: #1, #7)
  - [ ] Create `app/(dashboard)/admin/users/page.tsx`
  - [ ] Use shadcn/ui `Table` component for user list
  - [ ] Columns: Name, Email, Role (badge), Actions (role dropdown)
  - [ ] Add role-gated access check (redirect non-admins)
- [ ] Build role assignment UI (AC: #2, #4)
  - [ ] Create `components/admin/UserRoleSelect.tsx` with shadcn/ui `Select` dropdown
  - [ ] Options: Admin, Manager, Staff
  - [ ] On change: call `updateRole` mutation
  - [ ] Show success toast on completion
  - [ ] Show current role as selected value
- [ ] Enforce API-level authorization (AC: #3, #7)
  - [ ] All user management queries/mutations use `requireRole(ctx, "admin")`
  - [ ] Test that non-admin calls receive `UNAUTHORIZED` ConvexError
- [ ] Create admin navigation (AC: #1)
  - [ ] Create `components/layout/Navbar.tsx` with navigation links
  - [ ] Show admin-only links (Users, Settings) conditionally based on role
  - [ ] Add to `app/(dashboard)/layout.tsx`

## Dev Notes

- **Clerk Backend API for role sync:** Use `@clerk/backend` or `@clerk/nextjs/server` — specifically `clerkClient.users.updateUserMetadata()` to set `publicMetadata.role`. This must run server-side (Convex action, not mutation).
- **Convex action for Clerk API calls:** Since Clerk API is external HTTP, use a Convex `action` (not mutation) for the API call. The mutation updates Convex, then schedules the action for Clerk sync.
- **Idempotent webhook handling:** When our app updates Clerk metadata, it triggers a `user.updated` webhook. The webhook handler should check if Convex role already matches before updating to avoid infinite loops.
- **First admin bootstrapping:** The first user may need to be manually set as admin via Clerk dashboard `publicMetadata` or Convex dashboard. Document this in the story.
- **Role display:** Use shadcn/ui `Badge` component with color variants for each role.

### Project Structure Notes

```
app/(dashboard)/admin/users/page.tsx   # Admin user management page
convex/
  users.ts                              # Add list query, updateRole mutation
  clerkAdmin.ts                         # Internal action for Clerk Backend API calls
components/
  admin/
    UserRoleSelect.tsx                  # Role dropdown component
  layout/
    Navbar.tsx                          # Navigation with role-based links
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — Authorization pattern, requireRole helper
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Role storage dual sync
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md] — FR2, FR3, FR4, FR6

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
