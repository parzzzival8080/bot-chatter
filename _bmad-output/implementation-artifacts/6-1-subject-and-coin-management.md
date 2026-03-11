# Story 6.1: Subject & Coin Management

Status: ready-for-dev

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

- [ ] Create subject CRUD mutations (AC: #1, #2, #3, #4)
  - [ ] In `convex/subjects.ts`, add `create` mutation — requires admin role, saves `{ name, isActive: true, createdAt: Date.now() }`
  - [ ] Add `update` mutation — update subject name by ID
  - [ ] Add `remove` mutation — soft delete: set `isActive: false` (don't hard delete, preserves task references)
  - [ ] Add `listAll` query — returns all subjects (both active and inactive) for admin management view
  - [ ] Existing `listActive` query already serves the task compose dropdown
- [ ] Create coin CRUD mutations (AC: #5)
  - [ ] In `convex/coins.ts`, add `create` mutation — same pattern as subjects
  - [ ] Add `update` mutation
  - [ ] Add `remove` mutation — soft delete
  - [ ] Add `listAll` query for admin view
  - [ ] Existing `listActive` query serves compose dropdown
- [ ] Build admin settings page (AC: #1, #6)
  - [ ] Create `app/(dashboard)/admin/settings/page.tsx`
  - [ ] Gate with admin role check
  - [ ] Two sections: Subjects management and Coins management
- [ ] Build SubjectManager component (AC: #1, #2, #3)
  - [ ] Create `components/admin/SubjectManager.tsx`
  - [ ] Display list of all subjects with name, active status, and action buttons
  - [ ] "Add" button opens inline form or dialog with name input
  - [ ] "Edit" button enables inline editing of name
  - [ ] "Remove" button with confirmation — calls remove mutation (soft delete)
  - [ ] Inactive subjects shown grayed out with option to reactivate
  - [ ] Use shadcn/ui: Card, Input, Button, Dialog (for add/edit), Badge (for status)
- [ ] Build CoinManager component (AC: #5)
  - [ ] Create `components/admin/CoinManager.tsx` — same pattern as SubjectManager
  - [ ] Display list of all coins with CRUD actions
  - [ ] Reuse the same UI patterns for consistency
- [ ] Add admin settings link to navigation (AC: #6)
  - [ ] Add "Settings" link to admin navigation in Navbar (if not already present from Story 1.3)
  - [ ] Link to `/admin/settings`

## Dev Notes

- **Soft delete pattern:** Never hard-delete subjects/coins. Set `isActive: false`. This preserves data integrity for existing tasks that reference them. The `listActive` query (from Story 2.1) already filters by `isActive: true`.
- **Reactivation:** Consider adding a "Reactivate" button for inactive items so admins can re-enable them without creating duplicates.
- **Component reuse:** SubjectManager and CoinManager are nearly identical. Consider a shared `ConfigItemManager` component that accepts table name and mutations as props, or just duplicate with minor differences.
- **Inline editing:** Use controlled inputs with save/cancel. shadcn/ui Input + Button pattern.
- **Validation:** Subject/coin names should be non-empty and unique (among active items). Add uniqueness check in create/update mutations.

### Project Structure Notes

```
app/(dashboard)/admin/settings/page.tsx  # Admin settings page
convex/
  subjects.ts                             # Add create, update, remove, listAll
  coins.ts                                # Add create, update, remove, listAll
components/
  admin/
    SubjectManager.tsx                    # Subject CRUD UI
    CoinManager.tsx                       # Coin CRUD UI
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — CRUD mutations pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Subjects and coins schema
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md] — FR29, FR30

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
