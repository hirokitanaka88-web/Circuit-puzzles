// Personal score history for the GitHub Pages build (stored on this device only).
const KEY = "combination-stats:v1";

export interface MyStats {
  points: number;
  puzzles: number;
  correct: number;
  best: number; // best single-puzzle points
  fastestPerfect: number | null; // seconds, fastest all-15-correct check
}

const EMPTY: MyStats = { points: 0, puzzles: 0, correct: 0, best: 0, fastestPerfect: null };

export function loadStats(): MyStats {
  try {
    return { ...EMPTY, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<MyStats>) };
  } catch {
    return EMPTY;
  }
}

export function recordScore(points: number, correct: number, elapsed: number): void {
  const s = loadStats();
  const next: MyStats = {
    points: s.points + points,
    puzzles: s.puzzles + 1,
    correct: s.correct + correct,
    best: Math.max(s.best, points),
    fastestPerfect: correct === 15 ? Math.min(s.fastestPerfect ?? Infinity, elapsed) : s.fastestPerfect,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage blocked
  }
}

export function resetStats(): void {
  localStorage.removeItem(KEY);
}
