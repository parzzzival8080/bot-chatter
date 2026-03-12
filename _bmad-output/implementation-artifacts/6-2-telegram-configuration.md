# Story 6.2: Telegram Configuration

Status: review

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

- [x] Create settings CRUD mutations (AC: #3, #6, #7)
  - [x] In `convex/settings.ts`, add `set` mutation — requires admin role, upserts setting by key
  - [x] Accept `{ key: string, value: string }`, set `updatedAt: Date.now()`
  - [x] Add `get` query — requires admin role, returns setting by key
  - [x] Add `getForDisplay` query — returns masked value for API key (show last 4 chars only)
  - [x] Note: `getByKey` internal query (from Story 2.2) is separate — no role check, for internal use by telegram action
- [x] Build Telegram settings section (AC: #1, #2)
  - [x] Create `components/admin/TelegramSettings.tsx`
  - [x] Two input fields: Bot API Token (password/masked input) and Chat ID (text input)
  - [x] Display current values: API key masked (e.g., `••••••••1234`), chat ID shown normally
  - [x] "Save" button to update both settings
  - [x] "Send Test" button to send a test message using current settings
  - [x] Uses shadcn/ui: Card, Input, Button, Label
- [x] Integrate into admin settings page (AC: #1)
  - [x] Add TelegramSettings component to `app/(dashboard)/admin/settings/page.tsx`
  - [x] Placed in its own card section below subject/coin management
- [x] Verify env variable fallback (AC: #5)
  - [x] `convex/telegram.ts` `sendMessage` action reads from settings table first, falls back to env vars
  - [x] Already implemented in Story 2.2
- [x] Security validation (AC: #3, #7)
  - [x] Settings `set` mutation requires admin role
  - [x] Settings `get` query requires admin role
  - [x] The `getByKey` internal query (used by telegram action) has no role check — it's internal only
  - [x] Bot token value never returned to client in full (only masked version via getForDisplay)
- [x] Create test message mutation
  - [x] `testTelegram` mutation requires admin role, schedules test message via telegram.sendMessage

## Dev Notes

- **Masked display:** When fetching the API key for display, return only the last 4 characters: `"••••••••" + value.slice(-4)`. Never send the full token to the client.
- **Settings table reuse:** The `settings` table was defined in Story 2.2 schema. This story adds the admin UI for managing its values and the admin-facing queries.
- **Internal vs admin queries:** `getByKey` (internal, no auth) is used by `sendTelegramMessage` action. `get` (admin role required) is used by the admin UI. Two separate query functions.
- **Upsert pattern:** The `set` mutation checks if a setting with the key exists. If yes, updates value + updatedAt. If no, inserts new record.

### Project Structure Notes

```
app/(dashboard)/admin/settings/page.tsx  # Admin settings page (Telegram section added)
convex/
  settings.ts                             # set mutation, get/getForDisplay queries, testTelegram mutation
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
Claude Opus 4.6
### Debug Log References
N/A
### Completion Notes List
- Added set mutation with upsert pattern, get query, getForDisplay query (masks tokens), and testTelegram mutation to convex/settings.ts
- Built TelegramSettings component with password input for token, text input for chat ID, save and test buttons
- Integrated into admin settings page below subject/coin management sections
- All admin queries/mutations gated with requireRole(ctx, "admin")
- Token masking: getForDisplay returns "••••••••" + last 4 chars for TOKEN keys
- Test message uses ctx.scheduler.runAfter to invoke internal telegram.sendMessage
### File List
- convex/settings.ts
- components/admin/TelegramSettings.tsx
- app/(dashboard)/admin/settings/page.tsx
- components/ui/label.tsx (installed via shadcn)
