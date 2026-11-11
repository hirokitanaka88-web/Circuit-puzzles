"""Combination-circuit puzzle generator (three worksheet topologies).

Values are chosen so every E, I, R, W answer is exact to at most 2 decimal places.
"""
import random
from fractions import Fraction as F
from typing import Callable, Optional, get_args

from fastapi import APIRouter, HTTPException

from models.puzzle import ElementValues, GivenValues, Puzzle, SolutionStep, Topology

router = APIRouter(prefix="/puzzles", tags=["puzzles"])

TOPOLOGIES: list[str] = list(get_args(Topology))
RESISTORS = [5, 10, 12, 15, 20, 25, 30, 40, 45, 50, 60, 75, 80, 90, 100, 120, 150]
CURRENTS = [F(1, 2), F(1), F(3, 2), F(2), F(5, 2), F(3), F(4), F(5), F(6)]
NICE_SOURCES = [6, 9, 12, 18, 24, 30, 36, 40, 45, 48, 50, 60, 72, 75, 80, 90, 100, 108, 110,
                120, 125, 150, 160, 180, 200, 208, 220, 225, 240, 250, 270, 277, 300, 360, 400, 480]
PRESETS = {  # fallback (R1, R2, R3, R4, E) known to be clean
    "series_parallel": (10, 25, 5, 15, F(60)),
    "parallel_branch": (30, 10, 30, 60, F(60)),
    "series_parallel_series": (10, 30, 60, 20, F(100)),
}


def _clean(x: F) -> bool:
    return (x * 100).denominator == 1


def f(x: F) -> str:
    return f"{float(x):.2f}".rstrip("0").rstrip(".")


def _par(a: F, b: F) -> F:
    return a * b / (a + b)


# --- solvers: return (rows {element: (E, I, R)}, intermediates) -----------------------------
def solve_series_parallel(r1, r2, r3, r4, e: F):
    r23 = F(r2 + r3)
    rp = _par(r23, F(r4))
    rt = r1 + rp
    it = e / rt
    ep = it * rp
    i23 = ep / r23
    rows = {"R1": (it * r1, it, F(r1)), "R2": (i23 * r2, i23, F(r2)), "R3": (i23 * r3, i23, F(r3)),
            "R4": (ep, ep / r4, F(r4)), "Total": (e, it, rt)}
    return rows, {"r23": r23, "rp": rp}


def solve_parallel_branch(r1, r2, r3, r4, e: F):
    r34 = _par(F(r3), F(r4))
    rb = r2 + r34
    rt = _par(F(r1), rb)
    ib = e / rb
    e34 = ib * r34
    rows = {"R1": (e, e / r1, F(r1)), "R2": (ib * r2, ib, F(r2)), "R3": (e34, e34 / r3, F(r3)),
            "R4": (e34, e34 / r4, F(r4)), "Total": (e, e / rt, rt)}
    return rows, {"r34": r34, "rb": rb}


def solve_series_parallel_series(r1, r2, r3, r4, e: F):
    r23 = _par(F(r2), F(r3))
    rt = r1 + r23 + r4
    it = e / rt
    e23 = it * r23
    rows = {"R1": (it * r1, it, F(r1)), "R2": (e23, e23 / r2, F(r2)), "R3": (e23, e23 / r3, F(r3)),
            "R4": (it * r4, it, F(r4)), "Total": (e, it, rt)}
    return rows, {"r23": r23}


SOLVERS: dict[str, Callable] = {
    "series_parallel": solve_series_parallel,
    "parallel_branch": solve_parallel_branch,
    "series_parallel_series": solve_series_parallel_series,
}


def _is_nice(rows) -> bool:
    return all(_clean(e) and _clean(i) and _clean(r) and _clean(i * i * r) for e, i, r in rows.values())


def _pick(topology: str, rng: random.Random):
    solver = SOLVERS[topology]
    for _ in range(50000):
        r = [rng.choice(RESISTORS) for _ in range(4)]
        if topology == "series_parallel_series":
            # Source isn't shown on this sheet, so drive by a nice current instead.
            rt = r[0] + _par(F(r[1]), F(r[2])) + r[3]
            e = rng.choice(CURRENTS) * rt
            if e.denominator != 1 or not 6 <= e <= 480:
                continue
        else:
            e = F(rng.choice(NICE_SOURCES))
        rows, inter = solver(*r, e)
        if _is_nice(rows) and rows["Total"][1] <= 10:
            return r, e, rows, inter
    *r, e = PRESETS[topology]
    rows, inter = solver(*r, e)
    return r, e, rows, inter


# --- worked solutions ----------------------------------------------------------------------
def _power_steps(rows, n: int) -> list[SolutionStep]:
    w = {k: i * i * r for k, (_e, i, r) in rows.items()}
    e_t, i_t, _ = rows["Total"]
    return [
        SolutionStep(title=f"{n}. Power (P = E × I)",
                     work=f"P1 = {f(w['R1'])} W;  P2 = {f(w['R2'])} W;  P3 = {f(w['R3'])} W;  P4 = {f(w['R4'])} W"),
        SolutionStep(title=f"{n + 1}. Total power (check)",
                     work=f"PT = ET × IT = {f(e_t)} × {f(i_t)} = {f(w['Total'])} W  =  P1 + P2 + P3 + P4"),
    ]


def steps_series_parallel(r, rows, x) -> list[SolutionStep]:
    r1, r2, r3, r4 = r
    e_t, i_t, r_t = rows["Total"]
    e1, ep, i23, i4 = rows["R1"][0], rows["R4"][0], rows["R2"][1], rows["R4"][1]
    return [
        SolutionStep(title="1. Upper branch (R2 + R3 in series)", work=f"R2,3 = R2 + R3 = {r2} + {r3} = {f(x['r23'])} Ω"),
        SolutionStep(title="2. Parallel bank (R2,3 ∥ R4)",
                     work=f"Rp = (R2,3 × R4) ÷ (R2,3 + R4) = ({f(x['r23'])} × {r4}) ÷ ({f(x['r23'])} + {r4}) = {f(x['rp'])} Ω"),
        SolutionStep(title="3. Total resistance", work=f"RT = R1 + Rp = {r1} + {f(x['rp'])} = {f(r_t)} Ω"),
        SolutionStep(title="4. Total current (Ohm's law)",
                     work=f"IT = ET ÷ RT = {f(e_t)} ÷ {f(r_t)} = {f(i_t)} A  (IT flows through R1, so I1 = {f(i_t)} A)"),
        SolutionStep(title="5. Voltage drop across R1", work=f"E1 = I1 × R1 = {f(i_t)} × {r1} = {f(e1)} V"),
        SolutionStep(title="6. Voltage across the parallel bank",
                     work=f"Ep = ET − E1 = {f(e_t)} − {f(e1)} = {f(ep)} V  (so E4 = {f(ep)} V)"),
        SolutionStep(title="7. Branch currents",
                     work=f"I2 = I3 = Ep ÷ R2,3 = {f(ep)} ÷ {f(x['r23'])} = {f(i23)} A;  I4 = Ep ÷ R4 = {f(ep)} ÷ {r4} = {f(i4)} A"),
        SolutionStep(title="8. Voltage drops in the upper branch",
                     work=f"E2 = I2 × R2 = {f(i23)} × {r2} = {f(rows['R2'][0])} V;  E3 = I3 × R3 = {f(i23)} × {r3} = {f(rows['R3'][0])} V"),
        *_power_steps(rows, 9),
    ]


def steps_parallel_branch(r, rows, x) -> list[SolutionStep]:
    r1, r2, r3, r4 = r
    e_t, i_t, r_t = rows["Total"]
    i1, e2, i2, e34 = rows["R1"][1], rows["R2"][0], rows["R2"][1], rows["R3"][0]
    return [
        SolutionStep(title="1. Lower part of the right branch (R3 ∥ R4)",
                     work=f"R3,4 = (R3 × R4) ÷ (R3 + R4) = ({r3} × {r4}) ÷ ({r3} + {r4}) = {f(x['r34'])} Ω"),
        SolutionStep(title="2. Right branch (R2 + R3,4 in series)",
                     work=f"Rb = R2 + R3,4 = {r2} + {f(x['r34'])} = {f(x['rb'])} Ω"),
        SolutionStep(title="3. Total resistance (R1 ∥ Rb)",
                     work=f"RT = (R1 × Rb) ÷ (R1 + Rb) = ({r1} × {f(x['rb'])}) ÷ ({r1} + {f(x['rb'])}) = {f(r_t)} Ω"),
        SolutionStep(title="4. Total current (Ohm's law)", work=f"IT = ET ÷ RT = {f(e_t)} ÷ {f(r_t)} = {f(i_t)} A"),
        SolutionStep(title="5. R1 is directly across the source",
                     work=f"E1 = ET = {f(e_t)} V;  I1 = E1 ÷ R1 = {f(e_t)} ÷ {r1} = {f(i1)} A"),
        SolutionStep(title="6. Right branch current (flows through R2)",
                     work=f"I2 = ET ÷ Rb = {f(e_t)} ÷ {f(x['rb'])} = {f(i2)} A  (check: IT − I1 = {f(i_t)} − {f(i1)});  E2 = I2 × R2 = {f(i2)} × {r2} = {f(e2)} V"),
        SolutionStep(title="7. Voltage across R3 ∥ R4",
                     work=f"E3 = E4 = ET − E2 = {f(e_t)} − {f(e2)} = {f(e34)} V;  I3 = {f(e34)} ÷ {r3} = {f(rows['R3'][1])} A;  I4 = {f(e34)} ÷ {r4} = {f(rows['R4'][1])} A"),
        *_power_steps(rows, 8),
    ]


def steps_series_parallel_series(r, rows, x) -> list[SolutionStep]:
    r1, r2, r3, r4 = r
    e_t, i_t, r_t = rows["Total"]
    p4 = i_t * i_t * r4
    e23 = rows["R2"][0]
    return [
        SolutionStep(title="1. Circuit current from R4's given power",
                     work=f"I4 = √(P4 ÷ R4) = √({f(p4)} ÷ {r4}) = {f(i_t)} A  — R1 and R4 are in series with the source, so IT = I1 = I4 = {f(i_t)} A"),
        SolutionStep(title="2. Parallel bank (R2 ∥ R3)",
                     work=f"R2,3 = (R2 × R3) ÷ (R2 + R3) = ({r2} × {r3}) ÷ ({r2} + {r3}) = {f(x['r23'])} Ω"),
        SolutionStep(title="3. Total resistance", work=f"RT = R1 + R2,3 + R4 = {r1} + {f(x['r23'])} + {r4} = {f(r_t)} Ω"),
        SolutionStep(title="4. Source voltage (Ohm's law)", work=f"ET = IT × RT = {f(i_t)} × {f(r_t)} = {f(e_t)} V"),
        SolutionStep(title="5. Series voltage drops",
                     work=f"E1 = IT × R1 = {f(i_t)} × {r1} = {f(rows['R1'][0])} V;  E4 = IT × R4 = {f(i_t)} × {r4} = {f(rows['R4'][0])} V"),
        SolutionStep(title="6. Voltage and currents in the parallel bank",
                     work=f"E2 = E3 = IT × R2,3 = {f(i_t)} × {f(x['r23'])} = {f(e23)} V;  I2 = {f(e23)} ÷ {r2} = {f(rows['R2'][1])} A;  I3 = {f(e23)} ÷ {r3} = {f(rows['R3'][1])} A"),
        *_power_steps(rows, 7),
    ]


STEPS: dict[str, Callable] = {
    "series_parallel": steps_series_parallel,
    "parallel_branch": steps_parallel_branch,
    "series_parallel_series": steps_series_parallel_series,
}


def build_puzzle(seed: Optional[int] = None, topology: Optional[str] = None, exclude: Optional[str] = None) -> Puzzle:
    rng = random.Random(seed)
    if topology is None:
        topology = rng.choice([t for t in TOPOLOGIES if t != exclude] or TOPOLOGIES)
    r, e, rows, inter = _pick(topology, rng)
    solution = [ElementValues(element=k, E=float(ev), I=float(i), R=float(rr), W=float(i * i * rr))
                for k, (ev, i, rr) in rows.items()]
    given_cells = ["R-R1", "R-R2", "R-R3", "R-R4"]
    if topology == "series_parallel_series":
        i4 = rows["R4"][1]
        given = GivenValues(R1=r[0], R2=r[1], R3=r[2], R4=r[3], P4=float(i4 * i4 * r[3]))
        given_cells.append("W-R4")
    else:
        given = GivenValues(R1=r[0], R2=r[1], R3=r[2], R4=r[3], E=float(e))
        given_cells.append("E-Total")
    return Puzzle(topology=topology, given=given, given_cells=given_cells, solution=solution,
                  steps=STEPS[topology](r, rows, inter))


@router.get("/new", response_model=Puzzle)
async def new_puzzle(seed: Optional[int] = None, topology: Optional[str] = None, exclude: Optional[str] = None):
    if topology is not None and topology not in TOPOLOGIES:
        raise HTTPException(status_code=422, detail=f"topology must be one of {TOPOLOGIES}")
    return build_puzzle(seed, topology, exclude)
