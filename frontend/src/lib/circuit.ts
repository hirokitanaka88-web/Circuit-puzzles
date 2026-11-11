import type { Element, Puzzle, Quantity } from "@/types/puzzle";

export const ELEMENTS: Element[] = ["R1", "R2", "R3", "R4", "Total"];
export const QUANTITIES: Quantity[] = ["E", "I", "R", "W"];
export const TOLERANCE = 0.01; // ±1%

export type CellKey = `${Quantity}-${Element}`;
export type CellStatus = "correct" | "incorrect" | "blank";
export type Answers = Partial<Record<CellKey, string>>;
export type Results = Partial<Record<CellKey, CellStatus>>;

export const cellKey = (q: Quantity, el: Element): CellKey => `${q}-${el}`;

/** Given cells: each resistor's R and the total (source) E. */
export function isGiven(q: Quantity, el: Element): boolean {
  return (q === "R" && el !== "Total") || (q === "E" && el === "Total");
}

export function fmt(n: number): string {
  return String(Number(n.toFixed(2)));
}

export function expected(p: Puzzle, q: Quantity, el: Element): number {
  const row = p.solution.find((r) => r.element === el);
  return row ? row[q] : NaN;
}

export function checkAnswers(p: Puzzle, answers: Answers): Results {
  const results: Results = {};
  for (const el of ELEMENTS) {
    for (const q of QUANTITIES) {
      if (isGiven(q, el)) continue;
      const key = cellKey(q, el);
      const raw = (answers[key] ?? "").trim().replace(",", ".");
      if (raw === "") {
        results[key] = "blank";
        continue;
      }
      const val = Number(raw);
      const exp = expected(p, q, el);
      results[key] =
        Number.isFinite(val) && Math.abs(val - exp) <= Math.abs(exp) * TOLERANCE + 1e-9
          ? "correct"
          : "incorrect";
    }
  }
  return results;
}
