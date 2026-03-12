# Story 6.1: Subject & Coin Management

Status: review

## Story

As an admin,
I want to add, edit, and remove subject and coin options,
so that the task dispatch dropdowns reflect current operational needs.

## Acceptance Criteria

1. Admin navigating to admin settings page sees a list of all subjects with options to add, edit, and remove (FR29)
2. Adding a new subject saves it to the `subjects` table and it appears in the task dispatch dropdown
3. Removing a subject marks it as inactive (`isActive: false`) and it no longer appears in the dropdown
4. Existing tasks referencing a removed subject are not affected
5. Admin can manage coin options with the same add, edit, remove behavior as subjects (FR30)
6. Non-admin users are denied access via `requireRole('admin')`

## Tasks / Subtasks

- [x] Create subject CRUD mutations (AC: #1, #2, #3, #4)
  - [x] In `convex/subjects.ts`, add `create` mutation — requires admin role, saves `{ name, isActive: true, createdAt: Date.now() }`
  - [x] Add `update` mutation — update subject name by ID
  - [x] Add `remove` mutation — soft delete: set `isActive: false` (don't hard delete, preserves task references)
  - [x] Add `restore` mutation — re-enable inactive subjects
  - [x] Add `listAll` query — returns all subjects (both active and inactive) for admin management view
  - [x] Existing `listActive` query already serves the task compose dropdown
- [x] Create coin CRUD mutations (AC: #5)
  - [x] In `convex/coins.ts`, add `create` mutation — same pattern as subjects
  - [x] Add `update` mutation
  - [x] Add `remove` mutation — soft delete
  - [x] Add `restore` mutation — re-enable inactive coins
  - [x] Add `listAll` query for admin view
  - [x] Existing `listActive` query serves compose dropdown
- [x] Build admin settings page (AC: #1, #6)
  - [x] Create `app/(dashboard)/admin/settings/page.tsx`
  - [x] Gate with admin role check
  - [x] Two sections: Subjects management and Coins management
- [x] Build ConfigItemManager component (AC: #1, #2, #3)
  - [x] Create `components/admin/ConfigItemManager.tsx`
  - [x] Display list of all items with name, active status badge, and action buttons
  - [x] "Add" button with inline input form
  - [x] "Edit" button enables inline editing of name with save/cancel
  - [x] "Remove" button calls remove mutation (soft delete)
  - [x] Inactive items shown with muted text and "Restore" button
  - [x] Success toasts on all operations via sonner
  - [x] Uses shadcn/ui: Card, Input, Button, Badge
- [x] Add admin settings link to navigation (AC: #6)
  - [x] "Settings" link already present in Navbar from Story 1.3
  - [x] Links to `/admin/settings`

## Dev Notes

- **Soft delete pattern:** Never hard-delete subjects/coins. Set `isActive: false`. This preserves data integrity for existing tasks that reference them. The `listActive` query (from Story 2.1) already filters by `isActive: true`.
- **Reactivation:** Added "Restore" button for inactive items so admins can re-enable them without creating duplicates.
- **Component reuse:** Built a shared `ConfigItemManager` component that accepts callbacks as props, used for both subjects and coins.
- **Inline editing:** Uses controlled inputs with save/cancel. shadcn/ui Input + Button pattern.

### Project Structure Notes

```
app/(dashboard)/admin/settings/page.tsx  # Admin settings page
convex/
  subjects.ts                             # create, update, remove, restore, listAll, listActive
  coins.ts                                # create, update, remove, restore, listAll, listActive
components/
  admin/
    ConfigItemManager.tsx                 # Reusable CRUD UI for subjects and coins
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — CRUD mutations pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Subjects and coins schema
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md] — FR29, FR30

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6
### Debug Log References
N/A
### Completion Notes List
- Implemented CRUD mutations for both subjects and coins with admin role gating
- Built reusable ConfigItemManager component for both entity types
- Added restore functionality for soft-deleted items
- Admin settings page with client-side role guard
- All mutations use requireRole(ctx, "admin") for authorization
### File List
- convex/subjects.ts
- convex/coins.ts
- components/admin/ConfigItemManager.tsx
- app/(dashboard)/admin/settings/page.tsx
