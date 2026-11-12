// One puzzle API for both builds:
//  - Emergent build (default): server generates, grades and scores; shared leaderboard.
//  - GitHub Pages build (VITE_STATIC_MODE=1): everything runs in the browser; points are personal.
import { apiGet, apiPost } from "@/lib/api";
import type { CheckRequest, CheckResponse, Puzzle, Reveal } from "@/types/puzzle";
import { POINTS_PER_BOX, checkAnswersLocally, timeFactor } from "@/lib/circuit";
import type { Answers } from "@/lib/circuit";
import { generatePuzzle } from "@/lib/offline/generator";
import type { FullPuzzle } from "@/lib/offline/generator";
import { recordScore } from "@/lib/myStats";

export const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === "1";

const STORE = "combination-puzzles:v1"; // static mode: recent full puzzles (with solutions)

function loadAll(): Record<string, FullPuzzle> {
  try {
    return JSON.parse(localStorage.getItem(STORE) ?? "{}") as Record<string, FullPuzzle>;
  } catch {
    return {};
  }
}
function saveOne(p: FullPuzzle) {
  const all = loadAll();
  all[p.id] = p;
  const keep = Object.values(all).sort((a, b) => b.issued_at.localeCompare(a.issued_at)).slice(0, 20);
  try {
    localStorage.setItem(STORE, JSON.stringify(Object.fromEntries(keep.map((x) => [x.id, x]))));
  } catch {
    // storage blocked — the puzzle still works for this session
  }
}
function getOne(id: string): FullPuzzle {
  const p = loadAll()[id];
  if (!p) throw new Error("Puzzle not found — press New Puzzle.");
  return p;
}
const toPublic = ({ id, topology, given, given_cells, issued_at }: FullPuzzle): Puzzle => ({
  id, topology, given, given_cells, issued_at,
});

export async function newPuzzle(exclude?: string): Promise<Puzzle> {
  if (!STATIC_MODE) return apiGet<Puzzle>(`/puzzles/new${exclude ? `?exclude=${exclude}` : ""}`);
  const p = generatePuzzle(exclude);
  saveOne(p);
  return toPublic(p);
}

export async function checkPuzzle(id: string, body: CheckRequest): Promise<CheckResponse> {
  if (!STATIC_MODE) return apiPost<CheckResponse>(`/puzzles/${id}/check`, body);
  const p = getOne(id);
  const results = checkAnswersLocally(p, p.solution, body.answers as Answers);
  const statuses = Object.values(results);
  const correct = statuses.filter((x) => x === "correct").length;
  const elapsed = (Date.now() - Date.parse(p.issued_at)) / 1000;
  let score: CheckResponse["score"];
  if (p.locked) score = { status: "already_locked", points: p.points, elapsed_seconds: p.locked_elapsed };
  else if (p.revealed) score = { status: "revealed", points: 0, elapsed_seconds: elapsed };
  else {
    const points = Math.round(correct * POINTS_PER_BOX * timeFactor(elapsed));
    saveOne({ ...p, locked: true, points, locked_elapsed: elapsed });
    recordScore(points, correct, elapsed);
    score = { status: "awarded", points, elapsed_seconds: elapsed };
  }
  return { results: results as CheckResponse["results"], correct, total: statuses.length, score };
}

export async function revealPuzzle(id: string): Promise<Reveal> {
  if (!STATIC_MODE) return apiPost<Reveal>(`/puzzles/${id}/reveal`);
  const p = getOne(id);
  saveOne({ ...p, revealed: true });
  return { solution: p.solution, steps: p.steps };
}
