/**
 * Tiny wrapper around the bot's read-only HTTP API.
 *
 * The base URL is read from `NEXT_PUBLIC_API_BASE` at build time. All
 * fetches use Next 14's revalidation hints so the panel is fast but not
 * stale: 30s for leaderboards, 60s for stats, 5 minutes for season
 * history (which only changes once a month).
 */
const BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");

if (!BASE && typeof window === "undefined") {
  // Surface the misconfiguration loudly in server logs at build/render.
  console.warn("NEXT_PUBLIC_API_BASE is not set — API calls will fail.");
}

async function get<T>(path: string, revalidate: number): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} on ${path}`);
  }
  return (await res.json()) as T;
}

export type LeaderboardRow = {
  user_id: string;
  display_name: string | null;
  points: number;
  weekly_points: number;
  monthly_points: number;
  competitions: number;
  wins: number;
  correct_answers: number;
  total_answers: number;
  best_streak: number;
};

export type Stats = {
  users: number;
  competitions: number;
  correct_answers: number;
  total_points: number;
};

export type Health = {
  ok: boolean;
  uptime_seconds: number;
  bot_user_id: number | null;
  bot_user_name: string | null;
  guilds: number;
};

export const api = {
  leaderboard: (scope: "all" | "weekly" | "monthly" = "all", limit = 25) =>
    get<{ scope: string; count: number; rows: LeaderboardRow[] }>(
      `/api/leaderboard?scope=${scope}&limit=${limit}`,
      30
    ),
  stats: () => get<Stats>("/api/stats", 60),
  health: () => get<Health>("/api/health", 15),
};
