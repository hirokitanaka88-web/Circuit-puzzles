// Mirrors backend/models/puzzle.py — keep in sync by hand.
export type Element = "R1" | "R2" | "R3" | "R4" | "Total";
export type Quantity = "E" | "I" | "R" | "W";

export type Topology = "series_parallel" | "parallel_branch" | "series_parallel_series";

export interface GivenValues {
  R1: number;
  R2: number;
  R3: number;
  R4: number;
  E: number | null; // source voltage, when given
  P4: number | null; // power of R4, when given
}

export interface ElementValues {
  element: Element;
  E: number;
  I: number;
  R: number;
  W: number;
}

export interface SolutionStep {
  title: string;
  work: string;
}

export interface Puzzle {
  id: string;
  topology: Topology;
  given: GivenValues;
  given_cells: string[]; // "<Q>-<Element>", e.g. "R-R1", "E-Total", "W-R4"
  solution: ElementValues[];
  steps: SolutionStep[];
}
