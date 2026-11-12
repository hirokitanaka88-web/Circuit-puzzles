from datetime import datetime
from typing import Dict, List, Literal, Optional
import uuid

from pydantic import BaseModel, Field

Element = Literal["R1", "R2", "R3", "R4", "Total"]
# series_parallel:        E -> R1 -> [ (R2 + R3) || R4 ]
# parallel_branch:        R1 across E, in parallel with R2 -> [ R3 || R4 ]
# series_parallel_series: E -> R1 -> [ R2 || R3 ] -> R4   (P4 given instead of E)
Topology = Literal["series_parallel", "parallel_branch", "series_parallel_series"]
CellStatus = Literal["correct", "incorrect", "blank"]
ScoreStatus = Literal["awarded", "already_locked", "revealed", "not_signed_in"]


class GivenValues(BaseModel):
    R1: float
    R2: float
    R3: float
    R4: float
    E: Optional[float] = None  # source voltage (V), when given
    P4: Optional[float] = None  # power of R4 (W), when given


class ElementValues(BaseModel):
    element: Element
    E: float  # volts
    I: float  # amps
    R: float  # ohms
    W: float  # watts


class SolutionStep(BaseModel):
    title: str
    work: str


class Puzzle(BaseModel):
    """What the learner receives — the solution stays on the server until revealed."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topology: Topology
    given: GivenValues
    given_cells: List[str]  # "<Q>-<Element>", e.g. "R-R1", "E-Total", "W-R4"
    issued_at: datetime  # timer starts here (aware UTC)


class Reveal(BaseModel):
    solution: List[ElementValues]
    steps: List[SolutionStep]


class CheckRequest(BaseModel):
    answers: Dict[str, str]  # "<Q>-<Element>" -> typed value


class ScoreResult(BaseModel):
    status: ScoreStatus
    points: int  # points recorded for this puzzle (0 unless awarded / already_locked)
    elapsed_seconds: float  # time used for scoring (or so far, if not locked)


class CheckResponse(BaseModel):
    results: Dict[str, CellStatus]
    correct: int
    total: int
    score: ScoreResult
