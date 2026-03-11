# Story 1.2: User Registration & Authentication

Status: ready-for-dev

## Story

As a user,
I want to register and log in using email/password or social login,
so that I can access the application securely.

## Acceptance Criteria

1. Unauthenticated users visiting `/sign-up` see a Clerk-powered registration form with email/password and social login options
2. Successful registration creates a Clerk user and triggers a `user.created` webhook
3. The webhook handler creates a new user record in the Convex `users` table with `clerkId`, `name`, `email`, and `role: null`
4. Registered users can sign in at `/sign-in` and are redirected to the app
5. Authenticated users with no assigned role see only their profile page and a message that they need a role assignment (FR5)
6. Users without a role cannot access any other app functionality

## Tasks / Subtasks

- [ ] Create Clerk auth pages (AC: #1, #4)
  - [ ] Create `app/(auth)/sign-in/[[...sign-in]]/page.tsx` with `<SignIn />` component
  - [ ] Create `app/(auth)/sign-up/[[...sign-up]]/page.tsx` with `<SignUp />` component
  - [ ] Style auth pages with centered layout using shadcn/ui Card component
- [ ] Set up Clerk webhook endpoint (AC: #2, #3)
  - [ ] Create `app/api/clerk/webhook/route.ts` as Next.js API route
  - [ ] Install `svix` package for webhook signature verification
  - [ ] Handle `user.created` event: extract `id`, `firstName`, `lastName`, `emailAddresses[0]`
  - [ ] Handle `user.updated` event: sync role changes from Clerk `publicMetadata.role` to Convex
  - [ ] Create `convex/users.ts` with `syncFromClerk` mutation (internal, called by webhook via Convex httpAction or direct mutation)
  - [ ] Configure Clerk dashboard: add webhook endpoint URL, subscribe to `user.created` and `user.updated` events
- [ ] Create Convex user sync mutation (AC: #3)
  - [ ] In `convex/users.ts`, create `upsertFromWebhook` mutation that inserts/updates user by `clerkId`
  - [ ] Create `getByClerkId` query to look up user by Clerk ID
  - [ ] Create `getCurrentUser` query using `ctx.auth.getUserIdentity()` for frontend use
- [ ] Implement no-role restriction (AC: #5, #6)
  - [ ] Create `components/layout/RoleGuard.tsx` that checks user role from Convex
  - [ ] If no role: show profile page with "Awaiting role assignment" message
  - [ ] If role assigned: render children (protected content)
  - [ ] Add RoleGuard to `app/(dashboard)/layout.tsx`
- [ ] Create basic profile/waiting page (AC: #5)
  - [ ] Create `components/layout/PendingApproval.tsx` showing user name, email, and waiting message
  - [ ] Style with shadcn/ui Card, clean centered layout

## Dev Notes

- **Webhook security:** Use `svix` to verify webhook signatures. Get the signing secret from Clerk dashboard webhook settings.
- **Webhook → Convex:** The webhook API route runs in Next.js serverless. It should call a Convex mutation directly using the Convex Node.js client (`ConvexHttpClient`). Import from `convex/browser`.
- **Clerk + Convex identity:** `ctx.auth.getUserIdentity()` returns the Clerk user's `subject` (which is the Clerk user ID). Use this to look up the user in Convex.
- **Social login:** Configured in Clerk dashboard (Google, GitHub, etc.). No code changes needed — Clerk handles it.
- **Webhook events for role sync:** `user.updated` fires when admin changes role via Clerk dashboard OR when our app updates `publicMetadata`. Handle idempotently.

### Project Structure Notes

```
app/
  api/clerk/webhook/route.ts  # Clerk webhook handler
  (auth)/
    sign-in/[[...sign-in]]/page.tsx
    sign-up/[[...sign-up]]/page.tsx
  (dashboard)/
    layout.tsx                 # Add RoleGuard wrapper
convex/
  users.ts                     # User queries and mutations
components/
  layout/
    RoleGuard.tsx              # Role-based access wrapper
    PendingApproval.tsx        # No-role waiting screen
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — Auth flow, Clerk + Convex integration
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Role storage: Clerk + Convex synced
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md] — FR1, FR5

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
