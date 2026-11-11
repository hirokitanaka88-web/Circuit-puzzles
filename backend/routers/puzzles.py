"""Combination-circuit puzzle generator.

Topology: E -> R1 (series) -> parallel bank [upper: R2 + R3 in series | lower: R4] -> back to E.
Values are chosen so every E, I, R, W answer is exact to at most 2 decimal places.
"""
import random
from fractions import Fraction as F
from typing import Optional

from fastapi import APIRouter

from models.puzzle import ElementValues, GivenValues, Puzzle, SolutionStep

router = APIRouter(prefix="/puzzles", tags=["puzzles"])

RESISTORS = [5, 10, 12, 15, 20, 25, 30, 40, 45, 50, 60, 75, 80, 90, 100, 120, 150]
CURRENTS = [F(1, 2), F(1), F(3, 2), F(2), F(5, 2), F(3), F(4), F(5), F(6)]
NICE_SOURCES = {6, 9, 12, 18, 24, 30, 36, 40, 45, 48, 50, 60, 72, 75, 80, 90, 100, 108, 110,
                120, 125, 150, 160, 180, 200, 208, 220, 225, 240, 250, 270, 277, 300, 360, 400, 480}
PRESET = (5, 10, 20, 30, F(3))  # R1, R2, R3, R4, I_total -> E = 60 V


def _clean(x: F) -> bool:
    return (x * 100).denominator == 1


def _fmt(x: F) -> str:
    s = f"{float(x):.2f}".rstrip("0").rstrip(".")
    return s


def _solve(r1: int, r2: int, r3: int, r4: int, it: F):
    r23 = F(r2 + r3)
    rp = r23 * r4 / (r23 + r4)
    rt = r1 + rp
    e = it * rt
    ep = it * rp
    i23 = ep / r23
    i4 = ep / r4
    rows = {
        "R1": (it * r1, it, F(r1)),
        "R2": (i23 * r2, i23, F(r2)),
        "R3": (i23 * r3, i23, F(r3)),
        "R4": (ep, i4, F(r4)),
        "Total": (e, it, rt),
    }
    return {"r23": r23, "rp": rp, "rt": rt, "e": e, "ep": ep, "i23": i23, "i4": i4, "rows": rows}


def _is_nice(s: dict) -> bool:
    if s["rp"].denominator != 1 or s["e"].denominator != 1 or int(s["e"]) not in NICE_SOURCES:
        return False
    for e, i, r in s["rows"].values():
        if not (_clean(e) and _clean(i) and _clean(i * i * r)):
            return False
    return True


def _pick(rng: random.Random):
    for _ in range(50000):
        r1, r2, r3, r4 = (rng.choice(RESISTORS) for _ in range(4))
        it = rng.choice(CURRENTS)
        s = _solve(r1, r2, r3, r4, it)
        if _is_nice(s):
            return (r1, r2, r3, r4, it), s
    return PRESET, _solve(*PRESET)


def _steps(r1: int, r2: int, r3: int, r4: int, s: dict) -> list[SolutionStep]:
    f = _fmt
    rows = s["rows"]
    w = {k: v[1] * v[1] * v[2] for k, v in rows.items()}
    return [
        SolutionStep(title="1. Upper branch (R2 + R3 in series)",
                     work=f"R2,3 = R2 + R3 = {r2} + {r3} = {f(s['r23'])} Ω"),
        SolutionStep(title="2. Parallel bank (R2,3 ∥ R4)",
                     work=f"Rp = (R2,3 × R4) ÷ (R2,3 + R4) = ({f(s['r23'])} × {r4}) ÷ ({f(s['r23'])} + {r4}) = {f(s['rp'])} Ω"),
        SolutionStep(title="3. Total resistance",
                     work=f"RT = R1 + Rp = {r1} + {f(s['rp'])} = {f(s['rt'])} Ω"),
        SolutionStep(title="4. Total current (Ohm's law)",
                     work=f"IT = ET ÷ RT = {f(s['e'])} ÷ {f(s['rt'])} = {f(rows['Total'][1])} A  (IT flows through R1, so I1 = {f(rows['R1'][1])} A)"),
        SolutionStep(title="5. Voltage drop across R1",
                     work=f"E1 = I1 × R1 = {f(rows['R1'][1])} × {r1} = {f(rows['R1'][0])} V"),
        SolutionStep(title="6. Voltage across the parallel bank",
                     work=f"Ep = ET − E1 = {f(s['e'])} − {f(rows['R1'][0])} = {f(s['ep'])} V  (so E4 = {f(s['ep'])} V)"),
        SolutionStep(title="7. Branch currents",
                     work=f"I2 = I3 = Ep ÷ R2,3 = {f(s['ep'])} ÷ {f(s['r23'])} = {f(s['i23'])} A;  I4 = Ep ÷ R4 = {f(s['ep'])} ÷ {r4} = {f(s['i4'])} A"),
        SolutionStep(title="8. Voltage drops in the upper branch",
                     work=f"E2 = I2 × R2 = {f(s['i23'])} × {r2} = {f(rows['R2'][0])} V;  E3 = I3 × R3 = {f(s['i23'])} × {r3} = {f(rows['R3'][0])} V"),
        SolutionStep(title="9. Power (P = E × I)",
                     work=f"P1 = {f(w['R1'])} W;  P2 = {f(w['R2'])} W;  P3 = {f(w['R3'])} W;  P4 = {f(w['R4'])} W"),
        SolutionStep(title="10. Total power (check)",
                     work=f"PT = ET × IT = {f(s['e'])} × {f(rows['Total'][1])} = {f(w['Total'])} W  =  P1 + P2 + P3 + P4"),
    ]


def build_puzzle(seed: Optional[int] = None) -> Puzzle:
    rng = random.Random(seed)
    (r1, r2, r3, r4, _it), s = _pick(rng)
    solution = [
        ElementValues(element=k, E=float(e), I=float(i), R=float(r), W=float(i * i * r))
        for k, (e, i, r) in s["rows"].items()
    ]
    return Puzzle(
        given=GivenValues(E=float(s["e"]), R1=r1, R2=r2, R3=r3, R4=r4),
        solution=solution,
        steps=_steps(r1, r2, r3, r4, s),
    )


@router.get("/new", response_model=Puzzle)
async def new_puzzle(seed: Optional[int] = None):
    return build_puzzle(seed)
