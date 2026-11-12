# Combination Circuits — Practice Worksheet (SPEC)

Single-page electrician-training worksheet. No auth, no DB persistence.

## Circuit topologies (New Puzzle always switches to a different one than shown)
- `series_parallel`: E → R1 → [ (R2 + R3) ∥ R4 ] (hexagon drawing). Given: R1–R4 + E_T.
- `parallel_branch`: R1 directly across E, in parallel with R2 → [ R3 ∥ R4 ]. Given: R1–R4 + E_T.
- `series_parallel_series`: E → R1 → [ R2 ∥ R3 ] → R4. Given: R1–R4 + P4 (power of R4); E_T NOT given.

## Backend
- `GET /api/puzzles/new?seed=&topology=&exclude=` (all optional) → `Puzzle { id, topology, given{R1..R4, E|null, P4|null}, given_cells["R-R1",…,"E-Total" or "W-R4"], solution[ {element: R1|R2|R3|R4|Total, E,I,R,W} ], steps[{title, work}] }`
- Generator (`backend/routers/puzzles.py`) picks nice whole resistor values + source E so every answer is exact to ≤2 decimals. `seed` makes it deterministic (seed=6 → E=60, R1=10, R2=25, R3=5, R4=15).
- Non-int seed or unknown topology → 422.

## Frontend (`/`)
- Layout mirrors the user's printed worksheet (header/title/Name-Class-Date removed at user request): serif (Lora) text, "1. Solve for the missing values:", hexagon-shaped parallel bank, boxed values (e.g. "150Ω", source "60V" boxed beside battery). Table: Total column first then R1–R4, rows E, I, R, P; cells read "E1 = ___".
- Answer table rows E, I, R, P (power, W) on the left × columns R1, R2, R3, R4, Total (testid keys still use W for power). Given cells (read-only) come from `given_cells`. 15 input cells, testids `input-{Q}-{Element}` e.g. `input-I-Total`.
- Check Answers: ±1% tolerance; marks correct (green ✓) / incorrect or blank (red ✕); summary `validation-summary-badge` "x / 15 correct".
- Reveal Solution: shows `worked-solution-card` (10 steps) and the correct value under each input.
- Clear resets inputs; New Puzzle fetches a fresh puzzle.
- If backend unreachable, bundled sample puzzle (`src/lib/samplePuzzle.ts`, seed 6) is shown.
- Persistence: current puzzle + answers + check results + revealed state are saved to localStorage (`combination-worksheet:v1`) on every change and restored on load — reload/tab switch keeps the same puzzle and entries. Only "New Puzzle" replaces the puzzle (and clears entries); "Clear" empties entries. The offline sample is never saved.
- Ohm's law formula wheel (P, I, E, R with 12 formulas, from user's printed chart): sticky right sidebar on ≥1024px (formula-wheel-sidebar); on smaller screens a floating 'Formulas' button (formula-wheel-toggle) bottom-right opens it in a corner popup (formula-wheel-popup).

## Leaderboard / scoring (added)
- Players: username (3–20 chars, case-insensitive unique) + PIN (4–6 digits, bcrypt). `POST /api/auth/login` signs in OR creates the name if new (wrong PIN for existing name → 401). httpOnly `session` cookie; `GET /api/auth/me` → User or null; `POST /api/auth/logout`.
- Puzzles are stored server-side (`db.puzzles`, TTL 60d). `GET /api/puzzles/new` returns NO solution: `{id, topology, given, given_cells, issued_at}`.
- `POST /api/puzzles/{id}/check {answers: {"I-Total": "2", ...}}` → `{results, correct, total, score{status, points, elapsed_seconds}}`. Server grades (±1%). Score locks on the FIRST check by a signed-in player of an unrevealed puzzle: points = round(correct × 10 × factor), factor 1 if ≤120 s from issued_at, linear to 0 at 900 s. Status: awarded | already_locked (later checks) | revealed | not_signed_in (no lock; sign in and check again to score).
- `POST /api/puzzles/{id}/reveal` → `{solution, steps}` and marks puzzle revealed (0 points if not already locked). UI confirms first (reveal-confirm-dialog).
- `GET /api/leaderboard?limit=` → entries ranked by total points (sum over scored puzzles), ties → earlier last_played.
- UI: player-bar (sign-in form or "Playing as X" + sign out) with live timer (puzzle-timer-clock) and "N pts per correct box now"; leaderboard-card in right column (below worksheet on mobile).
- localStorage key now `combination-worksheet:v2` (puzzle, answers, results, score, reveal, showSolution).
- If a signed-in player presses Check with empty boxes before scoring, check-confirm-dialog asks to confirm (check-confirm-button) since the first check locks points.
