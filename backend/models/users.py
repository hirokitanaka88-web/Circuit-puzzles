from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=20, pattern=r"^[A-Za-z0-9_\- ]+$")
    pin: str = Field(min_length=4, max_length=6, pattern=r"^\d+$")


class User(BaseModel):
    id: str
    username: str


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    points: int
    puzzles: int  # puzzles scored
    correct: int  # correct boxes across scored puzzles
    last_played: datetime


class Leaderboard(BaseModel):
    entries: List[LeaderboardEntry]
