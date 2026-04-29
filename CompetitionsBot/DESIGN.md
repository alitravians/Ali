# CompetitionsBot — Design Doc (v1.3 → v2.0)

> **Status:** in-progress reference document for the 7-wave feature suite requested by Ali.
> Each wave is a self-contained PR. DB migrations are forward-only and idempotent.

---

## 0. Current Baseline (v1.2.0)

| Area | State |
|---|---|
| Cogs | 11 (quiz, race, daily, tournament, contest, leaderboard, profile, stats_loop, admin, help_cmd, welcome, logs, updates) |
| Achievements | 8 hardcoded in `config.ACHIEVEMENTS`, granted after each quiz. |
| Categories | 9 (`عام, عربي, تاريخ, جغرافيا, رياضة, تقنية, إسلامي, علوم, أفلام`) — usable as quiz filter, but **no per-category stats or leaderboard**. |
| Streaks | tracked in `users.streak/best_streak/perfect_runs` + `daily_state.streak_days` — but no bonus on streak milestones. |
| Roles | 8 server roles (champion/active/expert/newbie/mod/vip/weekly_winner/banned) + auto-assign based on competitions count. |
| Channels | 19 (4 categories) + 8 admin-only logs. |
| Persistence | SQLite at `/data/competitions.db` on fly.io volume. |

---

## 1. Wave Plan (Top-Level)

| # | Wave | Branch | Effort | Risk | DB Migrations |
|---|---|---|---|---|---|
| 1 | Achievements expansion + per-category stats/leaderboard | `devin/<ts>-w1-achievements-categories` | M | low | extend |
| 2 | Seasons / Leagues (monthly cycles, ranked tiers) | `devin/<ts>-w2-seasons` | M | medium | +2 tables |
| 3 | Daily streak bonuses + open question submissions | `devin/<ts>-w3-streaks-submissions` | M | low | +1 table |
| 4 | Duels (1v1 ELO) + Teams/Clans | `devin/<ts>-w4-duels-teams` | L | medium | +3 tables |
| 5 | Auto-moderation patterns + DB backup automation | `devin/<ts>-w5-auto-mod-backup` | M | medium | +1 table |
| 6 | Advanced admin tools (question CRUD, schedule, health) | `devin/<ts>-w6-admin-tools` | M | low | +2 tables |
| 7 | Web panel (Next.js on Vercel) | `devin/<ts>-w7-web-panel` | XL | medium | new repo subdir |

After each wave: redeploy fly.io, post v1.X.0 announcement to `📣│تحديثات-البوت` via CHANGELOG.json.

---

## 2. Wave 1 — Achievements ★ + Categories 🏷

### 2.1 Goals
- Expand `ACHIEVEMENTS` from 8 to **24** covering: gameplay milestones (wins/competitions), accuracy, streaks, speed, *category-specific mastery*, daily-login streaks, and special events.
- Track per-category stats so `/profile` shows accuracy per category, and `/leaderboard category:تاريخ` shows category-specific rankings.

### 2.2 DB changes (idempotent ALTERs)
```sql
-- New table: per-user per-category counters
CREATE TABLE IF NOT EXISTS category_stats (
    user_id   INTEGER NOT NULL,
    category  TEXT    NOT NULL,
    correct   INTEGER NOT NULL DEFAULT 0,
    total     INTEGER NOT NULL DEFAULT 0,
    points    INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, category)
);
CREATE INDEX IF NOT EXISTS idx_cat_points ON category_stats(category, points DESC);

-- Optional column on users (if not already there)
-- (achievements column already exists)
```

### 2.3 New achievements (24 total)
Tiered: `🥉 Bronze / 🥈 Silver / 🥇 Gold / 💎 Diamond`.

| ID | Tier | Title | Trigger |
|---|---|---|---|
| `first_win` | 🥉 | أول فوز | wins >= 1 |
| `wins_10` | 🥈 | عشرة فائز | wins >= 10 |
| `wins_50` | 🥇 | خمسون فائز | wins >= 50 |
| `wins_100` | 💎 | مئة فائز | wins >= 100 |
| `streak_5` | 🥉 | سلسلة 5 | best_streak >= 5 |
| `streak_10` | 🥈 | سلسلة 10 | best_streak >= 10 |
| `streak_25` | 🥇 | سلسلة 25 | best_streak >= 25 |
| `perfect_run` | 🥈 | جولة مثالية | perfect_runs >= 1 |
| `perfect_5` | 🥇 | خمس جولات مثاليات | perfect_runs >= 5 |
| `speedster` | 🥉 | سريع البديهة | fast_answers >= 1 |
| `speedster_50` | 🥇 | برق المعرفة | fast_answers >= 50 |
| `veteran` | 🥈 | مخضرم | competitions >= 25 |
| `legend` | 💎 | أسطورة | competitions >= 200 |
| `scholar` | 🥈 | عالم | points >= 1000 |
| `master` | 🥇 | معلّم | points >= 5000 |
| `god_tier` | 💎 | مُتقن المعرفة | points >= 25000 |
| `accuracy_80` | 🥇 | دقّة عالية | accuracy >= 80% over 100+ answers |
| `daily_7` | 🥈 | أسبوع متواصل | daily_streak_days >= 7 |
| `daily_30` | 💎 | شهر متواصل | daily_streak_days >= 30 |
| `cat_history` | 🥇 | مؤرّخ | category_stats[تاريخ].correct >= 50 |
| `cat_geo` | 🥇 | جغرافي | category_stats[جغرافيا].correct >= 50 |
| `cat_science` | 🥇 | عالم بيولوجي | category_stats[علوم].correct >= 50 |
| `cat_islam` | 🥇 | فقيه | category_stats[إسلامي].correct >= 50 |
| `cat_master` | 💎 | متعدّد الفنون | mastery in ≥ 4 categories |

### 2.4 Commands (added/changed)
- `/leaderboard scope:[weekly|monthly|all] category:[optional]` — extend existing with optional category filter.
- `/profile [user]` — extend embed with collapsible "إحصائيات حسب الفئة" field listing top categories.
- `/achievements [user]` — NEW: dedicated cog showing earned + locked badges + progress bars.

### 2.5 Permissions
No new channels needed. Achievement awards already post to `🟢 مسابقات-نشاط` indirectly via existing flow.

---

## 3. Wave 2 — Seasons / Leagues 🏆

### 3.1 Goals
- Monthly seasons (configurable). At season end: top 3 get rewards (rank role + points multiplier next season), all other points reset to 0 (but lifetime totals preserved).
- Tier system based on seasonal points: 🥉 Bronze (0–500) / 🥈 Silver (501–1500) / 🥇 Gold (1501–3500) / 💎 Diamond (3501+).

### 3.2 DB changes
```sql
CREATE TABLE IF NOT EXISTS seasons (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    started_at  REAL NOT NULL,
    ends_at     REAL NOT NULL,
    closed      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS season_results (
    season_id   INTEGER NOT NULL,
    user_id     INTEGER NOT NULL,
    points      INTEGER NOT NULL,
    rank        INTEGER NOT NULL,
    tier        TEXT NOT NULL,
    PRIMARY KEY (season_id, user_id)
);
```

### 3.3 New cog: `seasons.py`
- Background task: every 6 h, check if active season ended → close it, snapshot top 50, reset weekly/monthly/season points, start new season.
- `/season info` — current season name + days remaining + your rank/tier.
- `/season history [season_id]` — past season top 10.

### 3.4 New roles (4)
`Bronze Tier` 🥉 / `Silver Tier` 🥈 / `Gold Tier` 🥇 / `Diamond Tier` 💎. Auto-assigned at season-close based on final points.

### 3.5 Channel
New read-only channel `🏆│المواسم` (under المسابقات) showing the season leaderboard auto-refreshed every 5 min, plus pinned messages for past season winners.

---

## 4. Wave 3 — Daily Streak Bonuses + Open Submissions 📥

### 4.1 Daily streak bonuses
Extend `/daily` (already exists):
- Day 1: +10
- Day 3: +30 (3-day combo)
- Day 7: +100 (week badge `daily_7`)
- Day 14: +200
- Day 30: +500 (month badge `daily_30`)
Additionally DM the user a "see you tomorrow!" reminder 24 h before streak breaks.

### 4.2 Open question submissions
Members propose questions, admins approve.

#### DB
```sql
CREATE TABLE IF NOT EXISTS submitted_questions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    submitted_by  INTEGER NOT NULL,
    submitted_at  REAL NOT NULL,
    category      TEXT NOT NULL,
    difficulty    TEXT NOT NULL,
    type          TEXT NOT NULL,         -- mcq | tf
    payload       TEXT NOT NULL,         -- JSON
    status        TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
    reviewed_by   INTEGER,
    reviewed_at   REAL,
    rejection_reason TEXT
);
```

#### Commands
- `/submit_question` — opens a Discord modal with category, difficulty, type, question text, choices/answer, optional explanation.
- `/admin questions pending` — paginated list for review.
- `/admin questions approve <id>` / `reject <id> <reason>` — moderation actions.
Approved questions auto-merge into the live `questions.py` pool by writing to `data/user_questions.json` (loaded at next pool refresh).

#### Reward
Submitter earns +50 points + `contributor` achievement on first approval, +500 + `contributor_10` on 10th.

### 4.3 New channel: `📤│اقتراح-أسئلة` (open-write, under المسابقات).

---

## 5. Wave 4 — Duels (1v1 ELO) + Teams/Clans ⚔

### 5.1 Duels
- `/duel @user [category] [difficulty]` — challenge another member to a 5-question 1v1.
- Both must answer simultaneously; faster correct answer wins each round; best of 5.
- ELO rating system (initial 1000, K-factor 32). Top-rated members get a `🎯 لاعب الأسبوع` rotation already wired up via the existing `role_weekly_winner`.

#### DB
```sql
CREATE TABLE IF NOT EXISTS duels (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    challenger    INTEGER NOT NULL,
    opponent      INTEGER NOT NULL,
    started_at    REAL NOT NULL,
    ended_at      REAL,
    winner        INTEGER,
    score_a       INTEGER NOT NULL DEFAULT 0,
    score_b       INTEGER NOT NULL DEFAULT 0,
    rating_change INTEGER
);

ALTER TABLE users ADD COLUMN elo_rating INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE users ADD COLUMN duel_wins  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN duel_losses INTEGER NOT NULL DEFAULT 0;
```

### 5.2 Teams / Clans
Members create up to 50 teams of up to 10 members each. Team points = sum of members' weekly points.

#### DB
```sql
CREATE TABLE IF NOT EXISTS teams (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT UNIQUE NOT NULL,
    tag       TEXT UNIQUE NOT NULL,    -- 3-5 letters
    icon      TEXT,                     -- emoji
    captain   INTEGER NOT NULL,
    created_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS team_members (
    team_id   INTEGER NOT NULL,
    user_id   INTEGER NOT NULL UNIQUE,
    joined_at REAL NOT NULL,
    role      TEXT NOT NULL DEFAULT 'member', -- captain | officer | member
    PRIMARY KEY (team_id, user_id)
);
```

#### Commands
- `/team create <name> <tag> [icon]`
- `/team join <name>` (captain approves via reaction in clan channel)
- `/team leave`
- `/team kick <user>` (captain only)
- `/team info [name]`
- `/team leaderboard` — top 10 teams.

#### Channel: `⚔│الفرق` (open-write).

---

## 6. Wave 5 — Auto-Moderation + DB Backup 🛡

### 6.1 Auto-mod patterns
Detect:
- Same answer text from ≥3 distinct users within 1 second window in `🎯│المسابقة-الحالية` → flag potential collusion → log + 5-min mute.
- Spam: ≥5 messages in <3 s by same user → soft-mute + warn.
- Banned-word list (configurable JSON) → delete + DM warning.

#### DB
```sql
CREATE TABLE IF NOT EXISTS warnings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    reason      TEXT NOT NULL,
    issued_by   INTEGER,                  -- 0 if auto
    issued_at   REAL NOT NULL,
    severity    TEXT NOT NULL              -- low | medium | high
);
```

#### Commands
- `/admin warn <user> <reason> [severity]`
- `/admin warnings <user>` — history.
- `/admin clear_warnings <user>`

### 6.2 DB Backup automation
Daily cron task in `bot/cogs/backup.py`:
- Compresses `/data/competitions.db` with timestamp.
- Posts to a dedicated webhook URL (set via env `BACKUP_WEBHOOK_URL`) OR uploads to S3 if `AWS_*` secrets set.
- Posts a "✅ Backup successful (3.2MB at 03:00 UTC)" entry to `🛠 مسابقات-إدارة` log.
- Retention: keep 14 days of backups, auto-delete older.

---

## 7. Wave 6 — Advanced Admin Tools 🔧

### 7.1 Question CRUD from Discord
- `/admin question add` — modal-based question creation (no redeploy needed).
- `/admin question edit <id>`
- `/admin question delete <id>`
- `/admin question list [category] [difficulty]` — paginated.

Stored in `data/user_questions.json` (read by `questions.py.refresh_pool()`).

### 7.2 Scheduled announcements
- `/admin schedule <channel> <time> <message>` — posts at the specified time.
- Time format: `2026-05-01T20:00` or relative `+2h`.
- Background task ticks every 60 s, posts due jobs.

#### DB
```sql
CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id  INTEGER NOT NULL,
    payload     TEXT NOT NULL,             -- JSON: {message, embed?}
    run_at      REAL NOT NULL,
    created_by  INTEGER NOT NULL,
    posted      INTEGER NOT NULL DEFAULT 0
);
```

### 7.3 Health command
- `/admin health` — admin-only, returns:
  - Bot uptime
  - DB size + total rows
  - Memory (RSS)
  - Latency to Discord gateway
  - Last 5 errors (from logs)
  - Pending scheduled jobs count
  - Backup status (last backup age)

### 7.4 Bulk actions
- `/admin season force_close` — close current season immediately.
- `/admin reset_user <user>` — wipe a user's stats (with confirmation).
- `/admin migration run <name>` — manual schema migrations.

---

## 8. Wave 7 — Web Panel (Next.js + Vercel) 🌐

### 8.1 Goals
Public-facing dashboard:
- Server stats homepage (active competitions, total questions, top players)
- Per-user profile pages (linked from `/profile` command via DM)
- Achievement showcase
- Past season archive
- Submitted-question approval queue (admin-only via Discord OAuth)

### 8.2 Stack
- Next.js 14 App Router on Vercel
- API: Discord bot exposes a read-only HTTP endpoint (FastAPI sidecar in same fly.io app or separate Cloudflare Worker reading SQLite via Tigris bucket replication).
- Auth: Discord OAuth2 for admin actions
- Hosting: Vercel project `competitions-panel-am` (per user's standing knowledge: always Vercel, never devinapps.com)

### 8.3 Pages
- `/` — landing with live stats
- `/leaderboard` — interactive table, filter by season/category
- `/profile/[user_id]` — public profile
- `/seasons/[id]` — season archive
- `/admin/submissions` — pending question approvals (Discord-OAuth gated)
- `/changelog` — pulled from CHANGELOG.json

### 8.4 Deploy notes (per user knowledge)
- Use Vercel CLI + `WarScope-Deploy` token
- Add `vercel.json` with SPA rewrites
- Deployment: same URL across deploys (no devinapps.com)

---

## 9. Cross-cutting Standards

### 9.1 Permissions (per user's standing requirement)
Every wave that adds channels MUST:
1. Use `fix_permissions.py`'s 3-tier model (admin-only / read-only / open).
2. Add bot_role explicit allow on read-only channels (per Devin Review fix in PR #109).
3. Update `server_config.json` with new IDs.
4. Re-run `fix_permissions.py` and verify with audit script.

### 9.2 CHANGELOG.json
Every wave bumps version (v1.3 → v1.4 → … → v2.0) and prepends entry to `CHANGELOG.json` so members see clean release notes in `📣│تحديثات-البوت`.

### 9.3 Tests / Verification
For each wave:
1. Syntax check (`python -m py_compile`)
2. DB migration runs cleanly on existing v1.2 DB
3. Smoke test on fly.io: bot connects, all cogs load, no warnings
4. Live test of new commands (manually or scripted)

### 9.4 Rollback
Each wave is a separate PR + commit, mergeable independently. fly.io can rollback via `flyctl releases rollback`. DB migrations are forward-only but additive (no destructive ALTERs); old code won't break on new schema.

---

## 10. Implementation Order

This document drives execution order. Wave 1 starts immediately after this doc lands. Subsequent waves only start after the prior wave's PR is merged + redeployed + smoke-tested + announced.
