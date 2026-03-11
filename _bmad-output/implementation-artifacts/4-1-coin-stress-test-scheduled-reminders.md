# Story 4.1: Coin Stress Test Scheduled Reminders

Status: ready-for-dev

## Story

As a team member,
I want to receive Telegram reminders when a coin stress test is about to start and when it ends,
so that the team is prepared and aware of timing windows.

## Acceptance Criteria

1. When a coin stress test task is saved to Convex, two scheduled functions are created via `ctx.scheduler.runAt`: one for start time, one for end time
2. When start time is reached, a Telegram message is sent: `⏰ Reminder: Coin stress test [Subject] for [Coin] is starting now!` (FR19)
3. When end time is reached, a Telegram message is sent: `⏰ Reminder: Coin stress test [Subject] for [Coin] has ended!` (FR20)
4. Scheduled functions fire within +/- 60 seconds tolerance (NFR13)
5. If Telegram is unreachable, retries via the shared `sendTelegramMessage` action (3 retries, exponential backoff)

## Tasks / Subtasks

- [ ] Create scheduled reminder functions (AC: #1, #2, #3)
  - [ ] Create `convex/reminders.ts` with two internal functions:
    - `sendStartReminder` — accepts `taskId`, reads task, sends start Telegram message
    - `sendEndReminder` — accepts `taskId`, reads task, sends end Telegram message
  - [ ] Both use `internal.telegram.sendMessage` for delivery (reuses shared action with retry)
  - [ ] Message formats:
    - Start: `⏰ Reminder: Coin stress test ${subject} for ${coin} is starting now!`
    - End: `⏰ Reminder: Coin stress test ${subject} for ${coin} has ended!`
- [ ] Update task create mutation to schedule reminders (AC: #1)
  - [ ] In `convex/tasks.ts`, update `create` mutation
  - [ ] After saving a stress test task, schedule both reminders:
    - `ctx.scheduler.runAt(startTime, internal.reminders.sendStartReminder, { taskId })`
    - `ctx.scheduler.runAt(endTime, internal.reminders.sendEndReminder, { taskId })`
  - [ ] Only schedule for tasks with `type === "stressTest"` (skip for simple tasks)
- [ ] Handle edge cases (AC: #4)
  - [ ] If start time is in the past (already passed), send reminder immediately
  - [ ] If task is deleted or completed before reminder fires, check task still exists in reminder function
  - [ ] Log warning if task not found when reminder fires (don't throw)
- [ ] Resolve coin name in reminder messages (AC: #2, #3)
  - [ ] Reminder functions need to look up coin name from `coins` table using task's `coinId`
  - [ ] Also look up subject name if stored as reference

## Dev Notes

- **`ctx.scheduler.runAt`:** Schedules a function to run at a specific timestamp. Convex guarantees execution within +/- 60 seconds (NFR13). The scheduled function receives the provided args.
- **Internal functions:** Use `internalMutation` or `internalAction` for reminder functions since they're only called by the scheduler, never from the client.
- **Idempotency:** The reminder function should be safe to call multiple times (in case of Convex retries). Since it just sends a message, this is naturally idempotent.
- **Task reference lookups:** When the reminder fires, read the task from the database to get current subject and coin info. Don't pass large payloads through the scheduler — just pass `taskId`.
- **Subject/coin resolution:** If subject and coin are stored as string names on the task (denormalized), no lookup needed. If stored as IDs (references), need to resolve in the reminder function.

### Project Structure Notes

```
convex/
  reminders.ts           # sendStartReminder, sendEndReminder internal functions
  tasks.ts               # Update create mutation to schedule reminders for stress tests
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Convex scheduled functions, crons
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Telegram delivery pattern
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md] — FR19, FR20, NFR13

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
