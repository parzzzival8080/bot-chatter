---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: 'complete'
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/architecture.md']
---

# bot-chatter - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bot-chatter, decomposing the requirements from the PRD and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: Users can register for an account using email/password or social login
- FR2: Admins can view a list of all registered users and their current roles
- FR3: Admins can assign a role (Admin, Manager, or Staff) to any registered user
- FR4: Admins can change a user's role at any time
- FR5: Users without an assigned role cannot access any app functionality beyond their profile
- FR6: The system restricts access to features based on the user's assigned role
- FR7: Managers and Admins can compose a simple task by selecting a subject from a dropdown and entering a body message
- FR8: Managers and Admins can compose a coin stress test by selecting a subject, selecting a coin from a dropdown, entering a body message, and setting a start time and end time
- FR9: Managers and Admins can toggle between simple task mode and coin stress test mode
- FR10: The system sends a formatted dispatch message to the configured Telegram group chat when a task is submitted
- FR11: The system displays a success toast notification after a task is successfully dispatched
- FR12: The dispatch message in Telegram follows the format: `[Sender Name] sent a [Subject] — [Body]`
- FR13: Staff can view all pending (unclaimed) tasks in a task table
- FR14: Staff can acknowledge (claim) a pending task with a single action
- FR15: Once a task is claimed by one staff member, other staff can no longer claim it
- FR16: The system sends an acknowledgement message to Telegram: `[Staff Name] acknowledged [Sender Name] [Subject]`
- FR17: Staff can mark a claimed task as done after completing the work
- FR18: The system sends a completion message to Telegram: `[Staff Name] is done with the [Sender Name] [Subject] task`
- FR19: The system sends a Telegram reminder message when a coin stress test start time is reached
- FR20: The system sends a Telegram reminder message when a coin stress test end time is reached
- FR21: Managers and Admins can view a task table showing all tasks with their current status (pending, claimed, done)
- FR22: The task table displays who claimed each task and timestamps for each state change
- FR23: The task table updates in real-time without page refresh when task states change
- FR24: Staff can view their own claimed and completed tasks
- FR25: Staff receive in-app notifications when a new task is dispatched
- FR26: Managers and Admins receive in-app notifications when a task is acknowledged
- FR27: Managers and Admins receive in-app notifications when a task is marked done
- FR28: Users can see a notification badge indicating unread notifications
- FR29: Admins can add, edit, and remove subject options in the subject dropdown
- FR30: Admins can add, edit, and remove coin options in the coin dropdown
- FR31: Admins can configure the Telegram Bot API key through the settings panel
- FR32: Admins can configure the Telegram chat ID through the settings panel
- FR33: The system falls back to environment variable defaults for Telegram configuration if no UI override is set

### NonFunctional Requirements

- NFR1: Task dispatch (submit to Telegram delivery): under 5 seconds end-to-end
- NFR2: Real-time task table updates: under 1 second via Convex subscriptions
- NFR3: Page load time: under 3 seconds on standard broadband
- NFR4: Task table renders smoothly with up to 500 tasks
- NFR5: Concurrent user support: up to 50 simultaneous users without degradation
- NFR6: All communication over HTTPS (TLS 1.2+)
- NFR7: Telegram Bot API key never exposed to the client — stored server-side only
- NFR8: Role-based access enforced at both UI and API levels (Convex mutation/query authorization)
- NFR9: Clerk handles all credential storage, password hashing, and session management
- NFR10: No sensitive data stored in localStorage or client-side state
- NFR11: Telegram Bot API: HTTP-based via Convex actions with retry logic (up to 3 retries, exponential backoff)
- NFR12: Clerk: Webhook integration for user registration events and role sync
- NFR13: Convex scheduled functions: reliable execution for reminders with tolerance of +/- 60 seconds
- NFR14: 99% uptime during operational hours
- NFR15: Graceful degradation if Telegram API is unreachable — tasks saved in Convex, Telegram delivery queued for retry
- NFR16: No task state data loss — all mutations are transactional via Convex
- NFR17: Optimistic locking on task claiming to prevent race conditions

### Additional Requirements

- Architecture specifies incremental addition to existing Next.js 16 project (not a fresh starter template) — install Convex, Clerk, shadcn/ui
- Convex schema with 6 tables: users, tasks, subjects, coins, notifications, settings
- Clerk + Convex role sync via webhook on user.created / user.updated
- ConvexProviderWithClerk wiring in root layout
- Clerk middleware protecting all routes except /sign-in and /sign-up
- requireRole() reusable helper for server-side authorization on every Convex mutation/query
- Shared sendTelegramMessage internal action with 3-retry exponential backoff
- Telegram messages are non-blocking (fire-and-forget via ctx.scheduler.runAfter)
- Convex scheduled functions (crons) for stress test start/end reminders
- Feature-based component organization under components/ (tasks/, notifications/, admin/, layout/)
- shadcn/ui for all UI primitives (button, input, select, toast, table, etc.)
- Zod for client-side form validation + Convex argument validators for server-side enforcement
- Desktop-first responsive design; task table must be usable on mobile
- Basic WCAG 2.1 Level A accessibility compliance

### FR Coverage Map

FR1: Epic 1 - User registration (email/password + social login)
FR2: Epic 1 - Admin user list view
FR3: Epic 1 - Admin role assignment
FR4: Epic 1 - Admin role changes
FR5: Epic 1 - Unassigned users restricted
FR6: Epic 1 - Role-based access control
FR7: Epic 2 - Compose simple task
FR8: Epic 2 - Compose coin stress test
FR9: Epic 2 - Toggle task mode
FR10: Epic 2 - Send dispatch to Telegram
FR11: Epic 2 - Success toast on dispatch
FR12: Epic 2 - Telegram message format
FR13: Epic 3 - Staff view pending tasks
FR14: Epic 3 - Staff claim task
FR15: Epic 3 - Optimistic locking on claims
FR16: Epic 3 - Telegram acknowledgement message
FR17: Epic 3 - Staff mark task done
FR18: Epic 3 - Telegram completion message
FR19: Epic 4 - Telegram reminder at stress test start
FR20: Epic 4 - Telegram reminder at stress test end
FR21: Epic 3 - Manager/Admin task table with status
FR22: Epic 3 - Task table shows claimer and timestamps
FR23: Epic 3 - Real-time task table updates
FR24: Epic 3 - Staff view own tasks
FR25: Epic 5 - Staff notified on new task
FR26: Epic 5 - Manager/Admin notified on acknowledgement
FR27: Epic 5 - Manager/Admin notified on task done
FR28: Epic 5 - Notification badge
FR29: Epic 6 - Admin manage subject options
FR30: Epic 6 - Admin manage coin options
FR31: Epic 6 - Admin configure Telegram API key
FR32: Epic 6 - Admin configure Telegram chat ID
FR33: Epic 6 - Fallback to env variable defaults

## Epic List

### Epic 1: Project Foundation & Authentication
Users can register, log in, and be assigned roles. Admins can manage user roles. The system enforces role-based access across all features. Includes Convex + Clerk + shadcn/ui setup, webhook role sync, and authorization infrastructure.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6

### Epic 2: Task Dispatch & Telegram Integration
Managers and Admins can compose and dispatch tasks (simple or coin stress test) that are sent as formatted messages to a configured Telegram group chat, with success feedback in the UI.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12

### Epic 3: Task Lifecycle & Tracking
Staff can view, claim, and complete tasks. Managers/Admins see all tasks with real-time status updates. Each state change triggers a Telegram notification. Task table shows claimer, timestamps, and updates live via Convex subscriptions.
**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR18, FR21, FR22, FR23, FR24

### Epic 4: Scheduled Reminders
The system automatically sends Telegram reminder messages when coin stress test start and end times are reached, using Convex scheduled functions.
**FRs covered:** FR19, FR20

### Epic 5: In-App Notifications
Staff, Managers, and Admins receive role-appropriate in-app notifications for task events, with an unread notification badge.
**FRs covered:** FR25, FR26, FR27, FR28

### Epic 6: Admin Configuration
Admins can manage subject and coin dropdown options, and configure Telegram Bot API credentials through a settings panel, with environment variable fallbacks.
**FRs covered:** FR29, FR30, FR31, FR32, FR33

## Epic 1: Project Foundation & Authentication

Users can register, log in, and be assigned roles. Admins can manage user roles. The system enforces role-based access across all features. Includes Convex + Clerk + shadcn/ui setup, webhook role sync, and authorization infrastructure.

### Story 1.1: Project Infrastructure Setup

As a developer,
I want the core project infrastructure (Convex, Clerk, shadcn/ui) installed and wired together,
So that all subsequent features have a working foundation to build on.

**Acceptance Criteria:**

**Given** the existing Next.js 16 project
**When** the developer runs the setup
**Then** Convex is installed and initialized with a `convex/` directory and dev deployment
**And** Clerk is installed with environment variables configured
**And** shadcn/ui is initialized with Tailwind CSS 4 integration
**And** `ConvexProviderWithClerk` wraps the app in the root layout
**And** Clerk middleware protects all routes except `/sign-in` and `/sign-up`
**And** the Convex schema defines the `users` table with fields: `clerkId`, `name`, `email`, `role`, `createdAt`
**And** a reusable `requireRole()` helper function exists for Convex mutation/query authorization
**And** the app renders without errors on `localhost`

### Story 1.2: User Registration & Authentication

As a user,
I want to register and log in using email/password or social login,
So that I can access the application securely.

**Acceptance Criteria:**

**Given** an unauthenticated user visits the app
**When** they navigate to `/sign-up`
**Then** they see a Clerk-powered registration form with email/password and social login options
**And** successful registration creates a Clerk user and triggers a webhook

**Given** a Clerk `user.created` webhook fires
**When** the webhook handler processes the event
**Then** a new user record is created in the Convex `users` table with `clerkId`, `name`, `email`, and `role: null`

**Given** a registered user visits `/sign-in`
**When** they enter valid credentials
**Then** they are authenticated and redirected to the app

**Given** an authenticated user with no assigned role
**When** they access the app
**Then** they see only their profile page and a message that they need a role assignment
**And** they cannot access any other app functionality (FR5)

### Story 1.3: Admin Role Management

As an admin,
I want to view all users and assign or change their roles,
So that I can control who has access to which features.

**Acceptance Criteria:**

**Given** an authenticated admin navigates to the user management page
**When** the page loads
**Then** they see a table of all registered users with columns: name, email, current role, and actions (FR2)

**Given** an admin views a user with no role assigned
**When** they select a role (Admin, Manager, or Staff) from a dropdown and confirm
**Then** the user's role is updated in both the Convex `users` table and Clerk `publicMetadata.role` (FR3)
**And** the `requireRole()` helper enforces the new role on subsequent requests

**Given** an admin views a user with an existing role
**When** they change the role to a different value and confirm
**Then** the role is updated in both Convex and Clerk (FR4)
**And** a Clerk `user.updated` webhook syncs the change

**Given** a non-admin user attempts to access the user management page
**When** the page or API is requested
**Then** access is denied at both the UI level (redirect) and API level (`requireRole()` throws UNAUTHORIZED) (FR6, NFR8)

## Epic 2: Task Dispatch & Telegram Integration

Managers and Admins can compose and dispatch tasks (simple or coin stress test) that are sent as formatted messages to a configured Telegram group chat, with success feedback in the UI.

### Story 2.1: Task Composition Form

As a manager or admin,
I want to compose a task by selecting a subject and entering details,
So that I can dispatch work instructions to my team.

**Acceptance Criteria:**

**Given** an authenticated manager or admin navigates to the task dispatch page
**When** the page loads
**Then** they see a task composition form with a subject dropdown and body message input (FR7)
**And** a toggle to switch between "Simple Task" and "Coin Stress Test" mode (FR9)

**Given** the user is in "Simple Task" mode
**When** they fill out the form
**Then** they must select a subject from the dropdown and enter a body message
**And** the form validates inputs with Zod before submission

**Given** the user toggles to "Coin Stress Test" mode
**When** the form updates
**Then** additional fields appear: coin dropdown, start time picker, and end time picker (FR8)
**And** all fields are required and validated (end time must be after start time)

**Given** the Convex schema
**When** the developer implements this story
**Then** the `tasks` table is created with fields: `type`, `subject`, `body`, `coin`, `startTime`, `endTime`, `status`, `senderId`, `senderName`, `claimedBy`, `claimedAt`, `completedAt`, `createdAt`
**And** the `subjects` table is created with fields: `name`, `isActive`, `createdAt`
**And** the `coins` table is created with fields: `name`, `isActive`, `createdAt`
**And** initial seed subjects are available in the dropdown

**Given** a non-manager/non-admin user attempts to access the dispatch page
**When** the page or mutation is requested
**Then** access is denied via `requireRole('manager', 'admin')`

### Story 2.2: Telegram Dispatch & Delivery

As a manager or admin,
I want submitted tasks to be sent as formatted messages to the Telegram group chat,
So that the team is immediately notified of new work.

**Acceptance Criteria:**

**Given** a manager or admin submits a valid task form
**When** the task mutation executes
**Then** the task is saved to the Convex `tasks` table with `status: "pending"`
**And** a Telegram message is dispatched non-blocking via `ctx.scheduler.runAfter` (FR10)
**And** a success toast notification appears in the UI (FR11)

**Given** a task is dispatched to Telegram
**When** the `sendTelegramMessage` internal action executes
**Then** the message follows the format: `📋 [Sender Name] sent a [Subject] — [Body]` (FR12)
**And** the Telegram Bot API key is read from server-side only (Convex environment variable or settings table) (NFR7)

**Given** the Telegram API is unreachable
**When** the `sendTelegramMessage` action fails
**Then** it retries up to 3 times with exponential backoff (NFR11)
**And** the task remains saved in Convex regardless of Telegram delivery status (NFR15)

**Given** the `sendTelegramMessage` internal action
**When** implemented
**Then** it is a shared, reusable Convex internal action accepting `message: string` as input
**And** it reads the Telegram bot token and chat ID from the `settings` table with env variable fallback

## Epic 3: Task Lifecycle & Tracking

Staff can view, claim, and complete tasks. Managers/Admins see all tasks with real-time status updates. Each state change triggers a Telegram notification. Task table shows claimer, timestamps, and updates live via Convex subscriptions.

### Story 3.1: Staff Task View & Claiming

As a staff member,
I want to view pending tasks and claim one with a single action,
So that I can take ownership of work and notify the team.

**Acceptance Criteria:**

**Given** an authenticated staff member navigates to the tasks page
**When** the page loads
**Then** they see a table of all pending (unclaimed) tasks with columns: subject, body, sender name, created time (FR13)

**Given** a staff member views a pending task
**When** they click the "Claim" button
**Then** the task status changes to `"claimed"` with their user ID in `claimedBy` and current timestamp in `claimedAt` (FR14)
**And** a Telegram message is sent: `✅ [Staff Name] acknowledged [Sender Name] [Subject]` (FR16)

**Given** two staff members attempt to claim the same task simultaneously
**When** both claim mutations execute
**Then** only the first succeeds; the second receives an `ALREADY_CLAIMED` error (FR15, NFR17)
**And** optimistic locking ensures no race condition via Convex transactional mutation

**Given** a non-staff user (or unassigned user) attempts to claim a task
**When** the mutation is called
**Then** access is denied via `requireRole('staff')`

### Story 3.2: Task Completion

As a staff member,
I want to mark my claimed tasks as done,
So that the team knows the work is finished.

**Acceptance Criteria:**

**Given** a staff member has claimed a task
**When** they click the "Mark Done" button on that task
**Then** the task status changes to `"done"` with current timestamp in `completedAt` (FR17)
**And** a Telegram message is sent: `🎉 [Staff Name] is done with the [Sender Name] [Subject] task` (FR18)

**Given** a staff member navigates to their tasks view
**When** the page loads
**Then** they see their own claimed and completed tasks in a filtered table (FR24)

**Given** a staff member tries to mark done a task they did not claim
**When** the mutation is called
**Then** the mutation rejects with an error (only the claimer can complete their task)

### Story 3.3: Manager/Admin Task Dashboard

As a manager or admin,
I want to see all tasks with their current status, claimer, and timestamps,
So that I can monitor team progress in real-time.

**Acceptance Criteria:**

**Given** an authenticated manager or admin navigates to the task dashboard
**When** the page loads
**Then** they see a table of all tasks with columns: subject, body, type, sender, status (pending/claimed/done), claimed by, and timestamps for each state change (FR21, FR22)

**Given** a task's status changes (claimed or completed by staff)
**When** the Convex subscription fires
**Then** the task table updates in real-time without page refresh (FR23, NFR2)

**Given** the task table contains up to 500 tasks
**When** the table renders
**Then** it scrolls and renders smoothly without performance degradation (NFR4)

**Given** a non-manager/non-admin user attempts to access the dashboard
**When** the page or query is requested
**Then** access is denied via `requireRole('manager', 'admin')`

## Epic 4: Scheduled Reminders

The system automatically sends Telegram reminder messages when coin stress test start and end times are reached, using Convex scheduled functions.

### Story 4.1: Coin Stress Test Scheduled Reminders

As a team member,
I want to receive Telegram reminders when a coin stress test is about to start and when it ends,
So that the team is prepared and aware of timing windows.

**Acceptance Criteria:**

**Given** a manager or admin submits a coin stress test task with a start time and end time
**When** the task is saved to Convex
**Then** two scheduled functions are created via `ctx.scheduler.runAt`: one for the start time and one for the end time

**Given** the current time reaches a coin stress test's start time
**When** the scheduled function fires (within +/- 60 seconds tolerance, NFR13)
**Then** a Telegram message is sent: `⏰ Reminder: Coin stress test [Subject] for [Coin] is starting now!` (FR19)

**Given** the current time reaches a coin stress test's end time
**When** the scheduled function fires
**Then** a Telegram message is sent: `⏰ Reminder: Coin stress test [Subject] for [Coin] has ended!` (FR20)

**Given** the Telegram API is unreachable when a reminder fires
**When** the `sendTelegramMessage` action fails
**Then** it retries up to 3 times with exponential backoff (reuses shared action from Epic 2)

## Epic 5: In-App Notifications

Staff, Managers, and Admins receive role-appropriate in-app notifications for task events, with an unread notification badge.

### Story 5.1: In-App Notification System

As a user,
I want to receive in-app notifications for task events relevant to my role,
So that I stay informed without needing to check Telegram.

**Acceptance Criteria:**

**Given** a new task is dispatched
**When** the task mutation completes
**Then** in-app notifications are created for all staff users (FR25)
**And** the `notifications` table is created with fields: `userId`, `type`, `message`, `taskId`, `isRead`, `createdAt`

**Given** a staff member claims a task
**When** the claim mutation completes
**Then** in-app notifications are created for all manager and admin users (FR26)

**Given** a staff member marks a task as done
**When** the completion mutation completes
**Then** in-app notifications are created for all manager and admin users (FR27)

**Given** a user has unread notifications
**When** they view the app header/navigation
**Then** a notification badge displays the count of unread notifications (FR28)

**Given** a user clicks the notification badge or notification area
**When** the notification list opens
**Then** they see their notifications ordered by most recent
**And** they can mark notifications as read (individually or all at once)
**And** the badge count updates accordingly

## Epic 6: Admin Configuration

Admins can manage subject and coin dropdown options, and configure Telegram Bot API credentials through a settings panel, with environment variable fallbacks.

### Story 6.1: Subject & Coin Management

As an admin,
I want to add, edit, and remove subject and coin options,
So that the task dispatch dropdowns reflect current operational needs.

**Acceptance Criteria:**

**Given** an authenticated admin navigates to the admin settings page
**When** they view the subjects section
**Then** they see a list of all subjects with options to add, edit, and remove (FR29)

**Given** an admin adds a new subject
**When** they enter a name and confirm
**Then** the subject is saved to the `subjects` table and appears in the task dispatch dropdown

**Given** an admin removes a subject
**When** they confirm the removal
**Then** the subject is marked inactive (`isActive: false`) and no longer appears in the dropdown
**And** existing tasks referencing that subject are not affected

**Given** an admin views the coins section
**When** they manage coin options
**Then** they can add, edit, and remove coins with the same behavior as subjects (FR30)

**Given** a non-admin user attempts to access the admin settings
**When** the page or mutation is requested
**Then** access is denied via `requireRole('admin')`

### Story 6.2: Telegram Configuration

As an admin,
I want to configure the Telegram Bot API key and chat ID through the UI,
So that I can manage Telegram integration without redeploying the app.

**Acceptance Criteria:**

**Given** an authenticated admin navigates to the Telegram settings section
**When** the page loads
**Then** they see input fields for the Telegram Bot API key and chat ID (FR31, FR32)
**And** current values are displayed (masked for the API key)

**Given** an admin enters a new Bot API key and/or chat ID
**When** they save the settings
**Then** the values are stored in the Convex `settings` table (server-side only, never exposed to client) (NFR7)
**And** the `sendTelegramMessage` action uses the new values on next execution

**Given** no UI override is set for Telegram configuration
**When** the `sendTelegramMessage` action reads settings
**Then** it falls back to environment variable defaults (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) (FR33)

**Given** the `settings` table
**When** the developer implements this story
**Then** the `settings` table is created with fields: `key`, `value`, `updatedAt`
**And** settings queries are restricted to admin role only
