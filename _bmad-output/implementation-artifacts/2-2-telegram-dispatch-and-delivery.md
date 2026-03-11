# Story 2.2: Telegram Dispatch & Delivery

Status: ready-for-dev

## Story

As a manager or admin,
I want submitted tasks to be sent as formatted messages to the Telegram group chat,
so that the team is immediately notified of new work.

## Acceptance Criteria

1. When a task mutation executes, the task is saved to Convex with `status: "pending"` and a Telegram message is dispatched non-blocking via `ctx.scheduler.runAfter` (FR10)
2. A success toast notification appears in the UI after dispatch (FR11)
3. The Telegram message follows the format: `📋 [Sender Name] sent a [Subject] — [Body]` (FR12)
4. The Telegram Bot API key is read from server-side only (NFR7)
5. If the Telegram API is unreachable, the action retries up to 3 times with exponential backoff (NFR11)
6. The task remains saved in Convex regardless of Telegram delivery status (NFR15)
7. `sendTelegramMessage` is a shared, reusable Convex internal action accepting `message: string`
8. It reads Telegram bot token and chat ID from the `settings` table with env variable fallback

## Tasks / Subtasks

- [ ] Create settings table in Convex schema (AC: #8)
  - [ ] In `convex/schema.ts`, add `settings` table: `key` (string, indexed), `value` (string), `updatedAt` (number)
  - [ ] Add index: `.index("by_key", ["key"])`
- [ ] Create settings query helper (AC: #8)
  - [ ] In `convex/settings.ts`, create `getByKey` internal query to retrieve a setting by key
  - [ ] Used by telegram action to get bot token and chat ID
- [ ] Create sendTelegramMessage internal action (AC: #3, #4, #5, #7, #8)
  - [ ] Create `convex/telegram.ts` with `sendMessage` as `internalAction`
  - [ ] Args: `{ message: v.string() }`
  - [ ] Read `TELEGRAM_BOT_TOKEN` from settings table, fallback to `process.env.TELEGRAM_BOT_TOKEN`
  - [ ] Read `TELEGRAM_CHAT_ID` from settings table, fallback to `process.env.TELEGRAM_CHAT_ID`
  - [ ] Call Telegram Bot API: `POST https://api.telegram.org/bot{token}/sendMessage` with `{ chat_id, text, parse_mode: "HTML" }`
  - [ ] Implement retry logic: 3 attempts, exponential backoff (1s, 2s, 4s)
  - [ ] On final failure: log error but don't throw (graceful degradation)
- [ ] Update task create mutation for Telegram dispatch (AC: #1, #6)
  - [ ] In `convex/tasks.ts`, update `create` mutation
  - [ ] After saving task, schedule Telegram message: `ctx.scheduler.runAfter(0, internal.telegram.sendMessage, { message })`
  - [ ] Format message: `📋 ${senderName} sent a ${subject} — ${body}`
  - [ ] Task save is transactional, Telegram is fire-and-forget
- [ ] Add success toast to compose form (AC: #2)
  - [ ] In `TaskComposeForm.tsx`, show shadcn/ui toast on successful mutation
  - [ ] Import `useToast` from shadcn/ui, call `toast({ title: "Task dispatched!" })` on success
  - [ ] Add `<Toaster />` component to root layout if not already present
- [ ] Add Convex environment variables (AC: #4)
  - [ ] Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in Convex dashboard env vars
  - [ ] Document in `.env.example` for reference (but these are Convex env vars, not Next.js)

## Dev Notes

- **Telegram Bot API:** `POST https://api.telegram.org/bot<token>/sendMessage` with JSON body `{ chat_id: string, text: string, parse_mode: "HTML" }`. Response: `{ ok: boolean, result: {...} }`.
- **Non-blocking dispatch:** `ctx.scheduler.runAfter(0, ...)` schedules the action to run immediately but doesn't block the mutation. The mutation returns success to the client before Telegram delivery.
- **Retry implementation:** Use a loop with `await new Promise(r => setTimeout(r, delay))` between retries. Delays: 1000ms, 2000ms, 4000ms.
- **Settings fallback pattern:** `const token = (await ctx.runQuery(internal.settings.getByKey, { key: "TELEGRAM_BOT_TOKEN" }))?.value ?? process.env.TELEGRAM_BOT_TOKEN`
- **Internal action vs action:** Use `internalAction` so it's not callable from the client — only from other Convex functions via `ctx.scheduler` or `ctx.runAction`.
- **Toast setup:** shadcn/ui toast requires `<Toaster />` in the layout. Add to `app/(dashboard)/layout.tsx`.

### Project Structure Notes

```
convex/
  schema.ts              # Add settings table
  telegram.ts            # sendMessage internal action
  settings.ts            # getByKey internal query
  tasks.ts               # Update create mutation with Telegram dispatch
components/
  tasks/
    TaskComposeForm.tsx  # Add toast on success
app/(dashboard)/
  layout.tsx             # Add <Toaster /> if needed
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Telegram delivery pattern, retry logic
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Settings table schema
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md] — FR10, FR11, FR12, NFR7, NFR11, NFR15

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
