# Review guidelines

These standards teach Devin Review what to flag (and what NOT to flag) on PRs in this
monorepo. This repo is a monorepo on the `arabic-localization` branch; each sub-project lives
in its own top-level folder. Apply the relevant section based on which folder a PR touches.

## General (all projects)
- Flag missing input validation on any data that crosses a trust boundary (HTTP request
  bodies/params, IPC messages, Discord interactions, Roblox `RemoteEvent`/`RemoteFunction`
  payloads, websocket frames).
- Flag unhandled error/rejection paths: `await` without try/catch on network/db calls,
  promises without `.catch`, and broad `except:`/`catch {}` that swallows errors silently.
- Never approve hard-coded secrets, tokens, or API keys. They must come from env/secret stores.
- Never approve hard-coded role IDs, channel IDs, or category IDs scattered across code —
  they must be referenced through a config file (e.g. `server_config.json`), by key.
- Flag use of `any` / `getattr` / `setattr` used to dodge proper typing.

## Discord bots (CompetitionsBot/, MusicBot/, boon-community-bot/, n8n-discord-bot/, message-assistant/)
- NEVER approve granting `ADMINISTRATOR` to a bot. It bypasses all per-channel overrides and
  cannot be scoped. Require the narrowest specific permission set instead.
- Enforce the three-tier channel permission model:
  - ADMIN-ONLY: deny `VIEW_CHANNEL` for `@everyone`; allow admin role + mod role + the bot's
    own role.
  - READ-ONLY: `@everyone` allow VIEW + READ_HISTORY + ADD_REACTIONS, deny SEND_MESSAGES +
    USE_APPLICATION_COMMANDS.
  - OPEN-WRITE: `@everyone` allow VIEW + SEND + USE_APPLICATION_COMMANDS + ADD_REACTIONS.
- The bot's own role MUST be in admin-only channel overwrites so it can still post logs.
- Admin command groups must set `default_permissions(...)` (e.g. `manage_guild=True`) so they
  are hidden from regular members in the slash menu, not just runtime-checked.
- New channels/roles/categories must be reflected in `server_config.json`.
- Flag long-running command handlers (>3s) that don't call `interaction.response.defer()`.
- Flag mismatched intents: privileged intents (`MESSAGE_CONTENT`, `GUILD_MEMBERS`) must be
  enabled both in code and assumed in the Developer Portal.

## Roblox — donation-city/ and roblox-scripts/ (Lua)
- Treat the client as untrusted. Flag any server logic that trusts client-sent values
  (currency, ownership, prices, booth tiers) without server-side validation.
- All `RemoteEvent`/`RemoteFunction` handlers must validate argument types and ranges before
  use; flag handlers that index/cast client args directly.
- DataStore access must use protected calls with retry/backoff and load-guards to avoid data
  loss/overwrite; flag raw `:SetAsync`/`:GetAsync` without `pcall` + retry.
- Important additions (src/ scripts, `inject_*.py`, `.rbxmx` assets, the built
  `DonationCity_FINAL.rbxlx`) must be committed — flag PRs that reference assets not added.

## BOON / alitravians Discord client mod (boon/, boon-installer/ — primarily the `alitravians-tool` branch)
- Build gate: `boon/` must pass `npm run typecheck` (0 errors) and `npm run build` before merge.
- Release reminder: merging a PR does NOT ship an update. A `boon-v<version>` tag must be
  pushed at the merge commit to trigger `.github/workflows/boon-release.yml`. Flag version
  bumps in `boon/package.json` that won't be matched by a release tag.
- Plugins live in `boon/src/plugins/<name>/index.ts`; entry points are `boon/src/patcher.ts`
  (Electron main, IPC + CSP bypass) and `boon/src/renderer.ts`. Flag network calls in the
  renderer that bypass the IPC-routed `BridgedFetch` and would hit Discord's CSP.
- Do not flag the token-protection PUA sentinel injection — it is intentional.

## chat-platform/ (Next.js + Prisma, RBAC + moderation)
- API route handlers must validate request bodies (e.g. with a schema) before use.
- Enforce RBAC level checks (numeric 0–100 tier) on privileged actions; flag mutations that
  don't verify the caller's RBAC level.
- Moderation/punishment actions (Warning/Mute/Ban) must write an `AuditLog` entry; flag
  privileged actions with no audit trail.
- New Prisma queries on large tables should have appropriate indexes.

## war-tracker-backend/ and chat-system/ (FastAPI / Python)
- Validate request models with Pydantic; flag endpoints reading raw dicts without schemas.
- External API calls (data aggregation, AI analysis) must handle timeouts and non-2xx
  responses; flag bare calls without error handling.
