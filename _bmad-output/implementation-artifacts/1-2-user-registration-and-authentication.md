# Story 1.2: User Registration & Authentication

Status: review

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

- [x] Create Clerk auth pages (AC: #1, #4)
  - [x] Create `app/(auth)/sign-in/[[...sign-in]]/page.tsx` with `<SignIn />` component
  - [x] Create `app/(auth)/sign-up/[[...sign-up]]/page.tsx` with `<SignUp />` component
  - [x] Style auth pages with centered layout using shadcn/ui Card component
- [x] Set up Clerk webhook endpoint (AC: #2, #3)
  - [x] Create `app/api/clerk/webhook/route.ts` as Next.js API route
  - [x] Install `svix` package for webhook signature verification
  - [x] Handle `user.created` event: extract `id`, `firstName`, `lastName`, `emailAddresses[0]`
  - [x] Handle `user.updated` event: sync role changes from Clerk `publicMetadata.role` to Convex
  - [x] Create `convex/users.ts` with `syncFromClerk` mutation (internal, called by webhook via Convex httpAction or direct mutation)
  - [x] Configure Clerk dashboard: add webhook endpoint URL, subscribe to `user.created` and `user.updated` events
- [x] Create Convex user sync mutation (AC: #3)
  - [x] In `convex/users.ts`, create `upsertFromWebhook` mutation that inserts/updates user by `clerkId`
  - [x] Create `getByClerkId` query to look up user by Clerk ID
  - [x] Create `getCurrentUser` query using `ctx.auth.getUserIdentity()` for frontend use
- [x] Implement no-role restriction (AC: #5, #6)
  - [x] Create `components/layout/RoleGuard.tsx` that checks user role from Convex
  - [x] If no role: show profile page with "Awaiting role assignment" message
  - [x] If role assigned: render children (protected content)
  - [x] Add RoleGuard to `app/(dashboard)/layout.tsx`
- [x] Create basic profile/waiting page (AC: #5)
  - [x] Create `components/layout/PendingApproval.tsx` showing user name, email, and waiting message
  - [x] Style with shadcn/ui Card, clean centered layout

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
Claude Opus 4.6
### Debug Log References
### Completion Notes List
- Webhook route uses svix for signature verification
- ConvexHttpClient used to call mutations from webhook API route
- RoleGuard wraps dashboard layout, redirecting no-role users to PendingApproval
- Auth pages use Clerk's built-in SignIn/SignUp components
### File List
- app/(auth)/sign-in/[[...sign-in]]/page.tsx (modified)
- app/(auth)/sign-up/[[...sign-up]]/page.tsx (modified)
- app/api/clerk/webhook/route.ts (created)
- convex/users.ts (created — shared with 1.3)
- components/layout/RoleGuard.tsx (created)
- components/layout/PendingApproval.tsx (created)
- app/(dashboard)/layout.tsx (modified — shared with 1.3)
- middleware.ts (modified — added webhook public route)
