# Story 6.2: Telegram Configuration

Status: ready-for-dev

## Story

As an admin,
I want to configure the Telegram Bot API key and chat ID through the UI,
so that I can manage Telegram integration without redeploying the app.

## Acceptance Criteria

1. Admin navigating to Telegram settings sees input fields for Bot API key and chat ID (FR31, FR32)
2. Current values are displayed (API key masked for security)
3. Saving stores values in the Convex `settings` table (server-side only, never exposed to client) (NFR7)
4. The `sendTelegramMessage` action uses the new values on next execution
5. When no UI override is set, the system falls back to environment variable defaults (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) (FR33)
6. The `settings` table has fields: `key`, `value`, `updatedAt`
7. Settings queries are restricted to admin role only

## Tasks / Subtasks

- [ ] Create settings CRUD mutations (AC: #3, #6, #7)
  - [ ] In `convex/settings.ts`, add `set` mutation — requires admin role, upserts setting by key
  - [ ] Accept `{ key: string, value: string }`, set `updatedAt: Date.now()`
  - [ ] Add `get` query — requires admin role, returns setting by key
  - [ ] Add `getForDisplay` query — returns masked value for API key (show last 4 chars only)
  - [ ] Note: `getByKey` internal query (from Story 2.2) is separate — no role check, for internal use by telegram action
- [ ] Build Telegram settings section (AC: #1, #2)
  - [ ] Create `components/admin/TelegramSettings.tsx`
  - [ ] Two input fields: Bot API Token (password/masked input) and Chat ID (text input)
  - [ ] Display current values: API key masked (e.g., `••••••••1234`), chat ID shown normally
  - [ ] "Save" button to update both settings
  - [ ] "Test" button (optional) to send a test message using current settings
  - [ ] Use shadcn/ui: Card, Input, Button, Label
- [ ] Integrate into admin settings page (AC: #1)
  - [ ] Add TelegramSettings component to `app/(dashboard)/admin/settings/page.tsx`
  - [ ] Place in its own section/card below subject/coin management
- [ ] Verify env variable fallback (AC: #5)
  - [ ] Ensure `convex/telegram.ts` `sendMessage` action reads from settings table first, falls back to env vars
  - [ ] This should already work from Story 2.2's implementation
  - [ ] Verify: if no settings row exists for `TELEGRAM_BOT_TOKEN`, use `process.env.TELEGRAM_BOT_TOKEN`
- [ ] Security validation (AC: #3, #7)
  - [ ] Settings `set` mutation requires admin role
  - [ ] Settings `get` query requires admin role
  - [ ] The `getByKey` internal query (used by telegram action) has no role check — it's internal only
  - [ ] Bot token value never returned to client in full (only masked version)

## Dev Notes

- **Masked display:** When fetching the API key for display, return only the last 4 characters: `"••••••••" + value.slice(-4)`. Never send the full token to the client.
- **Settings table reuse:** The `settings` table was defined in Story 2.2 schema. This story adds the admin UI for managing its values and the admin-facing queries.
- **Internal vs admin queries:** `getByKey` (internal, no auth) is used by `sendTelegramMessage` action. `get` (admin role required) is used by the admin UI. Two separate query functions.
- **Test message feature (optional):** A "Send Test Message" button that triggers a test Telegram message helps admins verify configuration. Use `ctx.scheduler.runAfter(0, internal.telegram.sendMessage, { message: "🔧 Test message from bot-chatter admin" })`.
- **Upsert pattern:** The `set` mutation should check if a setting with the key exists. If yes, update value + updatedAt. If no, insert new record.

### Project Structure Notes

```
app/(dashboard)/admin/settings/page.tsx  # Add Telegram settings section
convex/
  settings.ts                             # Add set mutation, get/getForDisplay queries
components/
  admin/
    TelegramSettings.tsx                  # Telegram config UI
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — Secrets management
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Settings table schema
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Telegram delivery, env var fallback
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.2] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md] — FR31, FR32, FR33, NFR7

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
