// Mirrors backend/models/puzzle.py — keep in sync by hand.
export type Element = "R1" | "R2" | "R3" | "R4" | "Total";
export type Quantity = "E" | "I" | "R" | "W";

export interface GivenValues {
  E: number;
  R1: number;
  R2: number;
  R3: number;
  R4: number;
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
  given: GivenValues;
  solution: ElementValues[];
  steps: SolutionStep[];
}
