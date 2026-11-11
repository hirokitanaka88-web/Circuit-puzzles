from typing import List, Literal
import uuid

from pydantic import BaseModel, Field

Element = Literal["R1", "R2", "R3", "R4", "Total"]


class GivenValues(BaseModel):
    E: float  # source voltage (V)
    R1: float
    R2: float
    R3: float
    R4: float


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
    given: GivenValues
    solution: List[ElementValues]
    steps: List[SolutionStep]
