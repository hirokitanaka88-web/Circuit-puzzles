import type { Puzzle, Reveal, ScoreResult } from "@/types/puzzle";
import type { Answers, Results } from "@/lib/circuit";

// Per-device persistence of the worksheet in progress (localStorage survives tab
// switches, reloads and the phone sleeping; only clearing site data resets it).
const KEY = "combination-worksheet:v2";

export interface SavedWorksheet {
  puzzle: Puzzle;
  answers: Answers;
  results: Results | null;
  score: ScoreResult | null;
  reveal: Reveal | null; // fetched solution (once revealed)
  showSolution: boolean;
}

export function loadWorksheet(): SavedWorksheet | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedWorksheet;
    if (!data?.puzzle?.issued_at || !Array.isArray(data.puzzle.given_cells)) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveWorksheet(data: SavedWorksheet): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage full or blocked (private mode) — the worksheet still works, just unsaved
  }
}
