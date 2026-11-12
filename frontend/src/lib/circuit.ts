import type { CellStatus, Element, ElementValues, Puzzle, Quantity } from "@/types/puzzle";

export const ELEMENTS: Element[] = ["R1", "R2", "R3", "R4", "Total"];
export const QUANTITIES: Quantity[] = ["E", "I", "R", "W"];
export const TOLERANCE = 0.01; // ±1%

// Scoring — mirrors backend/routers/puzzles.py.
export const POINTS_PER_BOX = 10;
export const FULL_POINTS_SECONDS = 120;
export const ZERO_POINTS_SECONDS = 900;

export function timeFactor(elapsed: number): number {
  if (elapsed <= FULL_POINTS_SECONDS) return 1;
  return Math.max(0, 1 - (elapsed - FULL_POINTS_SECONDS) / (ZERO_POINTS_SECONDS - FULL_POINTS_SECONDS));
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export type CellKey = `${Quantity}-${Element}`;
export type Answers = Partial<Record<CellKey, string>>;
export type Results = Partial<Record<string, CellStatus>>;

export const cellKey = (q: Quantity, el: Element): CellKey => `${q}-${el}`;

/** Given cells come from the puzzle (e.g. each R plus E_T, or each R plus P4). */
export function isGiven(p: Puzzle, q: Quantity, el: Element): boolean {
  return p.given_cells.includes(cellKey(q, el));
}

/** Value printed in a given cell. */
export function givenValue(p: Puzzle, q: Quantity, el: Element): number {
  if (q === "R" && el !== "Total") return p.given[el];
  if (q === "E" && el === "Total") return p.given.E ?? NaN;
  if (q === "W" && el === "R4") return p.given.P4 ?? NaN;
  return NaN;
}

export function fmt(n: number): string {
  return String(Number(n.toFixed(2)));
}

export function solutionValue(rows: ElementValues[], q: Quantity, el: Element): number {
  const row = rows.find((r) => r.element === el);
  return row ? row[q] : NaN;
}

/** Local grading — only for the bundled offline sample (real puzzles are graded on the server). */
export function checkAnswersLocally(p: Puzzle, rows: ElementValues[], answers: Answers): Results {
  const results: Results = {};
  for (const el of ELEMENTS) {
    for (const q of QUANTITIES) {
      if (isGiven(p, q, el)) continue;
      const key = cellKey(q, el);
      const raw = (answers[key] ?? "").trim().replace(",", ".");
      if (raw === "") {
        results[key] = "blank";
        continue;
      }
      const val = Number(raw);
      const exp = solutionValue(rows, q, el);
      results[key] =
        Number.isFinite(val) && Math.abs(val - exp) <= Math.abs(exp) * TOLERANCE + 1e-9 ? "correct" : "incorrect";
    }
  }
  return results;
}
