from typing import List, Literal, Optional
import uuid

from pydantic import BaseModel, Field

Element = Literal["R1", "R2", "R3", "R4", "Total"]
# series_parallel:        E -> R1 -> [ (R2 + R3) || R4 ]
# parallel_branch:        R1 across E, in parallel with R2 -> [ R3 || R4 ]
# series_parallel_series: E -> R1 -> [ R2 || R3 ] -> R4   (P4 given instead of E)
Topology = Literal["series_parallel", "parallel_branch", "series_parallel_series"]


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
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topology: Topology
    given: GivenValues
    given_cells: List[str]  # "<Q>-<Element>", e.g. "R-R1", "E-Total", "W-R4"
    solution: List[ElementValues]
    steps: List[SolutionStep]
