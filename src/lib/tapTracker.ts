export type TapStats = {
  total: number;
  today: number;
  byPage: Record<string, number>;
  lastTapAt: string | null;
  byCompanion: Record<string, number>;
};

const KEY = 'diani_tap_stats';
const DAY_MS = 24 * 60 * 60 * 1000;

export function getTapStats(): TapStats {
  const empty: TapStats = { total: 0, today: 0, byPage: {}, lastTapAt: null, byCompanion: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<TapStats>;
    return {
      total: typeof parsed.total === 'number' ? parsed.total : 0,
      today: typeof parsed.today === 'number' ? parsed.today : 0,
      byPage: parsed.byPage && typeof parsed.byPage === 'object' ? parsed.byPage : {},
      lastTapAt: typeof parsed.lastTapAt === 'string' ? parsed.lastTapAt : null,
      byCompanion: parsed.byCompanion && typeof parsed.byCompanion === 'object' ? parsed.byCompanion : {},
    };
  } catch {
    return empty;
  }
}

function writeStats(stats: TapStats) {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    // Storage unavailable — tracking is best-effort only.
  }
}

export function recordTap(page: string) {
  const stats = getTapStats();
  const now = Date.now();
  const todayKey = new Date().toDateString();
  const lastKey = stats.lastTapAt ? new Date(stats.lastTapAt).toDateString() : null;

  // Reset the daily counter if it's a new day.
  const today = lastKey === todayKey ? stats.today : 0;

  const next: TapStats = {
    ...stats,
    total: stats.total + 1,
    today: today + 1,
    byPage: {
      ...stats.byPage,
      [page]: (stats.byPage[page] || 0) + 1,
    },
    lastTapAt: new Date(now).toISOString(),
  };

  writeStats(next);
}

// Tracks detail-page views per companion so the admin dashboard can show which
// companions get the most attention.
export function recordCompanionView(companionId: string) {
  const stats = getTapStats();
  const next: TapStats = {
    ...stats,
    byCompanion: {
      ...stats.byCompanion,
      [companionId]: (stats.byCompanion[companionId] || 0) + 1,
    },
  };
  writeStats(next);
}

export function resetTapStats() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function formatTapTime(iso: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Never';
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

