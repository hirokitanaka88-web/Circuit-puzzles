# Combination Circuits — Practice Worksheet (SPEC)

Single-page electrician-training worksheet. No auth, no DB persistence.

## Circuit topology
Source E → R1 (series) → parallel bank [upper branch: R2 + R3 in series | lower branch: R4] → back to source.

## Backend
- `GET /api/puzzles/new?seed=<int optional>` → `Puzzle { id, given{E,R1..R4}, solution[ {element: R1|R2|R3|R4|Total, E,I,R,W} ], steps[{title, work}] }`
- Generator (`backend/routers/puzzles.py`) picks nice whole resistor values + source E so every answer is exact to ≤2 decimals. `seed` makes it deterministic (seed=6 → E=60, R1=10, R2=25, R3=5, R4=15).
- Non-int seed → 422.

## Frontend (`/`)
- Layout mirrors the user's printed worksheet (header/title/Name-Class-Date removed at user request): serif (Lora) text, "1. Solve for the missing values:", hexagon-shaped parallel bank, boxed values (e.g. "150Ω", source "60V" boxed beside battery). Table: Total column first then R1–R4, rows E, I, R, P; cells read "E1 = ___".
- Answer table rows E, I, R, P (power, W) on the left × columns R1, R2, R3, R4, Total (testid keys still use W for power). Given cells (read-only): R of R1–R4, E of Total. 15 input cells, testids `input-{Q}-{Element}` e.g. `input-I-Total`.
- Check Answers: ±1% tolerance; marks correct (green ✓) / incorrect or blank (red ✕); summary `validation-summary-badge` "x / 15 correct".
- Reveal Solution: shows `worked-solution-card` (10 steps) and the correct value under each input.
- Clear resets inputs; New Puzzle fetches a fresh puzzle.
- If backend unreachable, bundled sample puzzle (`src/lib/samplePuzzle.ts`, seed 6) is shown.
