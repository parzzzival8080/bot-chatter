---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments: ['_bmad-output/brainstorming/brainstorming-session-2026-03-11-1220.md']
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
  projectContext: 0
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document - bot-chatter

**Author:** mrchatbot
**Date:** 2026-03-11

## Executive Summary

Bot-chatter is a task dispatch and accountability system built on Next.js that turns Telegram group chats into structured operational channels. Managers and Admins compose tasks through a web interface — selecting a subject from a managed dropdown, optionally specifying a coin and time window for stress test coordination, and writing a body message. The Telegram bot broadcasts each action to the group chat, creating a real-time activity feed: task sent, task claimed, task completed. Staff claim tasks on a first-come-first-serve basis through the web app, then mark them done when finished. Every action is logged, tracked, and visible.

The system supports two message types: simple tasks (subject + body) for ad-hoc assignments, and coin stress tests (subject + coin + body + start time + end time) for timed coordinated operations with automated reminders. Three roles govern access — Admin (full control including settings, user management, and role assignment), Manager (task dispatch), and Staff (task claiming and completion). Authentication is handled via Clerk with self-registration; Admins assign roles after signup. All data — subjects, coins, configuration, task history — is stored in Convex.

## Product Differentiator

Bot-chatter meets teams where they already are — Telegram. Instead of replacing the communication channel, it layers accountability on top. The Telegram GC becomes an automatic audit trail visible to everyone, while the web app provides the control panel: compose, track, and manage. The three-phase message lifecycle (sent → acknowledged → done) gives Managers instant visibility into task status without follow-up messages. For timed operations like coin stress tests, automated start/end reminders keep the team synchronized without manual coordination.

## Project Classification

- **Project Type:** Web Application (Next.js SPA with real-time data via Convex)
- **Domain:** General / Business Operations (internal team task management and coordination)
- **Complexity:** Low (standard web app patterns, no regulatory requirements)
- **Project Context:** Greenfield (new product built from scratch)
- **Tech Stack:** Next.js, Convex, Clerk, Telegram Bot API

## Success Criteria

### User Success

- Managers dispatch a task in under 30 seconds (select subject, type body, hit send)
- Staff see new tasks immediately via Convex real-time sync and claim with one click
- Coin stress test reminders fire within 1 minute of scheduled start/end times
- All three Telegram bot messages (sent/acknowledged/done) deliver within 5 seconds of the triggering action
- Admin can onboard a new user (approve + assign role) in under 1 minute

### Business Success

- Full team adopted and actively using bot-chatter within 1 week of deployment
- Zero tasks "lost" — every dispatched task has a clear status (pending/claimed/done)
- Managers stop manually following up in the GC — bot-chatter handles accountability
- Reduction in missed or forgotten tasks compared to unstructured Telegram messaging

### Technical Success

- 99% uptime during operational hours
- Telegram Bot API failures handled gracefully with retry logic and user feedback
- Real-time updates across all connected clients via Convex subscriptions
- Clerk auth working with both email/password and social login
- All task state changes persisted in Convex with full audit trail

### Measurable Outcomes

- 100% of dispatched tasks reach the Telegram GC
- Average task claim time trackable per staff member
- Task completion rate visible in admin dashboard/logs
- Zero data loss on task lifecycle events

## User Journeys

### Journey 1: Manager Dispatches a Simple Task

**Marco, Operations Manager** — Marco manages a team of 8 staff. He needs to assign a cleaning task to whoever is available.

**Opening Scene:** Marco opens bot-chatter on his laptop. He has a task that needs doing now — the lobby needs cleaning before a client visit in 2 hours.

**Rising Action:** He selects "Simple Task" mode, picks "Cleaning" from the subject dropdown, types "Lobby needs to be cleaned before client arrives at 3pm" in the body, and hits Send.

**Climax:** Within seconds, the Telegram GC shows: **"Marco sent a Cleaning task — Lobby needs to be cleaned before client arrives at 3pm."** His phone buzzes with a Telegram notification. He doesn't need to do anything else.

**Resolution:** Two minutes later, he sees in the tracking table that Ana (Staff) has acknowledged the task. He can focus on other work knowing it's handled. Later, the GC shows: **"Ana is done with Marco's Cleaning task."** Marco never had to follow up.

### Journey 2: Manager Dispatches a Coin Stress Test

**Marco, Operations Manager** — Marco needs the team to coordinate a stress test on BTC starting at 8pm and ending at 10pm.

**Opening Scene:** Marco switches to "Coin Stress Test" mode in bot-chatter.

**Rising Action:** He selects "Stress Test" as subject, picks "BTC" from the coin dropdown, writes instructions in the body, sets start time to 8:00 PM and end time to 10:00 PM, and hits Send.

**Climax:** The GC immediately shows the dispatch message. At 7:59 PM, the bot sends a reminder: **"Reminder: BTC stress test starting now."** At 9:59 PM: **"Reminder: BTC stress test ending now."**

**Resolution:** Staff acknowledge and coordinate during the window. Each acknowledgement and completion is tracked and visible in both the GC and the web app.

### Journey 3: Staff Claims and Completes a Task

**Ana, Staff Member** — Ana is on shift and checking for new tasks.

**Opening Scene:** Ana opens bot-chatter and sees a notification badge — there's a new task from Marco. She also saw it pop up in the Telegram GC on her phone.

**Rising Action:** She opens the task table and sees the pending cleaning task. She clicks "Acknowledge" — instantly the GC shows: **"Ana acknowledged Marco's Cleaning task."** Other staff can no longer claim it.

**Climax:** Ana completes the cleaning. She returns to bot-chatter and clicks "Done."

**Resolution:** The GC shows: **"Ana is done with Marco's Cleaning task."** The task table updates to "Done" status. Marco sees it immediately. No back-and-forth needed.

### Journey 4: Admin Onboards a New Team Member

**Diego, Admin** — A new hire, Luis, needs access to bot-chatter.

**Opening Scene:** Diego gets a notification that a new user has registered.

**Rising Action:** Diego opens the Admin panel, sees Luis in the user list with no role assigned. He reviews Luis's info, selects "Staff" from the role dropdown, and saves.

**Climax:** Luis can now log in and see the task table, receive notifications, and claim tasks.

**Resolution:** Diego also adds a new coin "ETH" to the coin dropdown and a new subject "Maintenance" while he's in settings. The team's options expand without any downtime.

### Journey 5: Admin Manages Settings and Monitors Activity

**Diego, Admin** — Diego wants to check how the team is performing and update Telegram configuration.

**Opening Scene:** Diego opens the Admin dashboard. He sees the task log — all dispatched tasks with status, who claimed, timestamps.

**Rising Action:** He notices a task from yesterday is still in "Claimed" status — not yet marked done. He also needs to update the Telegram chat ID because the team moved to a new GC.

**Climax:** Diego updates the Telegram config in the settings panel (overriding the .env default). He sends Marco a message about the stuck task.

**Resolution:** The system now sends to the new GC. All historical logs are preserved. Diego has full visibility into team operations.

### Journey Requirements Summary

| Journey | Capabilities Revealed |
|---|---|
| Manager Simple Task | Subject dropdown, body input, send button, Telegram dispatch, success toast |
| Manager Stress Test | Coin dropdown, time pickers, scheduled reminders, message type toggle |
| Staff Claim & Complete | Task table, acknowledge button, done button, Telegram lifecycle messages, notification badge |
| Admin Onboard | User list, role assignment dropdown, registration notifications |
| Admin Settings | Config panel (API key, chat ID), subject/coin management, task log view |

## Web App Technical Requirements

Bot-chatter is a Single Page Application (SPA) built with Next.js App Router. Convex provides real-time data synchronization — all connected clients see task updates instantly without polling. Telegram Bot API calls are made server-side via Convex actions. Clerk provides middleware-based authentication with role metadata. Convex scheduled functions handle stress test start/end reminders. SEO is not relevant — this is an internal tool behind authentication.

### Browser & Device Support

- Modern evergreen browsers (Chrome, Firefox, Safari, Edge — latest 2 versions)
- Desktop-first design; responsive layout for tablet and mobile
- Task table must be usable on mobile viewports (staff may use phones)

### Accessibility

- Basic WCAG 2.1 Level A compliance
- Keyboard navigable forms and task table
- Sufficient color contrast for status indicators
- Screen reader compatible labels on interactive elements

## Product Scope & Phased Development

### MVP Strategy

**Approach:** Problem-solving MVP — deliver the core task dispatch and accountability loop. If Managers can send tasks, Staff can claim and complete them, and the Telegram GC reflects every state change — the product proves its value.

**Resource:** Solo developer using all managed services (Convex, Clerk, Vercel) — no infrastructure to maintain.

### MVP Feature Set (Phase 1)

**Core Journeys Supported:** All five user journeys (Manager dispatch, Staff claim/complete, Admin onboard/settings)

**Must-Have Capabilities:**
- Clerk auth with self-registration and Admin role assignment
- Message compose form with type toggle (simple task / coin stress test)
- Subject and coin dropdowns (Convex-backed, Admin-managed)
- Time picker for stress test start/end with automated Telegram reminders
- Telegram Bot API integration with three-phase lifecycle messages
- Task table with real-time status updates (pending/claimed/done)
- First-come-first-serve task claiming with optimistic locking
- In-app notification badges for new tasks, claims, completions
- Admin settings panel (Telegram config, subject/coin management, user/role management)
- Success toast on send

### Phase 2: Growth

- Full audit log view with filtering and search
- Task analytics dashboard (claim times, completion rates)
- Multiple Telegram group support
- Task priority levels
- File/image attachments

### Phase 3: Expansion

- Mobile-optimized PWA for Staff on the go
- Scheduled recurring tasks
- Integration with other messaging platforms (Discord, Slack)
- Task templates for common operations
- Webhook/API integrations for external automation

### Risk Mitigation

**Technical:** Telegram Bot API rate limits — mitigate with retry logic and message queuing via Convex. Scheduled function precision — mitigate by scheduling early with exact-time check.

**Market:** Low risk — internal team tool. Validation is immediate: does the team use it?

**Resource:** Solo developer — mitigate with fully managed services to eliminate DevOps overhead.

## Functional Requirements

### Authentication & User Management

- FR1: Users can register for an account using email/password or social login
- FR2: Admins can view a list of all registered users and their current roles
- FR3: Admins can assign a role (Admin, Manager, or Staff) to any registered user
- FR4: Admins can change a user's role at any time
- FR5: Users without an assigned role cannot access any app functionality beyond their profile
- FR6: The system restricts access to features based on the user's assigned role

### Task Dispatch

- FR7: Managers and Admins can compose a simple task by selecting a subject from a dropdown and entering a body message
- FR8: Managers and Admins can compose a coin stress test by selecting a subject, selecting a coin from a dropdown, entering a body message, and setting a start time and end time
- FR9: Managers and Admins can toggle between simple task mode and coin stress test mode
- FR10: The system sends a formatted dispatch message to the configured Telegram group chat when a task is submitted
- FR11: The system displays a success toast notification after a task is successfully dispatched
- FR12: The dispatch message in Telegram follows the format: `[Sender Name] sent a [Subject] — [Body]`

### Task Claiming & Completion

- FR13: Staff can view all pending (unclaimed) tasks in a task table
- FR14: Staff can acknowledge (claim) a pending task with a single action
- FR15: Once a task is claimed by one staff member, other staff can no longer claim it
- FR16: The system sends an acknowledgement message to Telegram: `[Staff Name] acknowledged [Sender Name] [Subject]`
- FR17: Staff can mark a claimed task as done after completing the work
- FR18: The system sends a completion message to Telegram: `[Staff Name] is done with the [Sender Name] [Subject] task`

### Scheduled Reminders

- FR19: The system sends a Telegram reminder message when a coin stress test start time is reached
- FR20: The system sends a Telegram reminder message when a coin stress test end time is reached

### Task Tracking & Visibility

- FR21: Managers and Admins can view a task table showing all tasks with their current status (pending, claimed, done)
- FR22: The task table displays who claimed each task and timestamps for each state change
- FR23: The task table updates in real-time without page refresh when task states change
- FR24: Staff can view their own claimed and completed tasks

### In-App Notifications

- FR25: Staff receive in-app notifications when a new task is dispatched
- FR26: Managers and Admins receive in-app notifications when a task is acknowledged
- FR27: Managers and Admins receive in-app notifications when a task is marked done
- FR28: Users can see a notification badge indicating unread notifications

### Admin Configuration

- FR29: Admins can add, edit, and remove subject options in the subject dropdown
- FR30: Admins can add, edit, and remove coin options in the coin dropdown
- FR31: Admins can configure the Telegram Bot API key through the settings panel
- FR32: Admins can configure the Telegram chat ID through the settings panel
- FR33: The system falls back to environment variable defaults for Telegram configuration if no UI override is set

## Non-Functional Requirements

### Performance

- Task dispatch (submit to Telegram delivery): under 5 seconds end-to-end
- Real-time task table updates: under 1 second via Convex subscriptions
- Page load time: under 3 seconds on standard broadband
- Task table renders smoothly with up to 500 tasks
- Concurrent user support: up to 50 simultaneous users without degradation

### Security

- All communication over HTTPS (TLS 1.2+)
- Telegram Bot API key never exposed to the client — stored server-side only
- Role-based access enforced at both UI and API levels (Convex mutation/query authorization)
- Clerk handles all credential storage, password hashing, and session management
- No sensitive data stored in localStorage or client-side state

### Integration

- Telegram Bot API: HTTP-based via Convex actions with retry logic (up to 3 retries, exponential backoff)
- Clerk: Webhook integration for user registration events and role sync
- Convex scheduled functions: reliable execution for reminders with tolerance of +/- 60 seconds

### Reliability

- 99% uptime during operational hours
- Graceful degradation if Telegram API is unreachable — tasks saved in Convex, Telegram delivery queued for retry
- No task state data loss — all mutations are transactional via Convex
- Optimistic locking on task claiming to prevent race conditions
