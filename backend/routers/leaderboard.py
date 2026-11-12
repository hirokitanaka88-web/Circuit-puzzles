from datetime import timezone

from fastapi import APIRouter

from lib.db import db
from models.users import Leaderboard, LeaderboardEntry

router = APIRouter(tags=["leaderboard"])


@router.get("/leaderboard", response_model=Leaderboard)
async def leaderboard(limit: int = 50):
    limit = max(1, min(limit, 100))
    rows = await db.scores.aggregate([
        {"$group": {"_id": "$user_id", "username": {"$last": "$username"}, "points": {"$sum": "$points"},
                    "puzzles": {"$sum": 1}, "correct": {"$sum": "$correct"},
                    "last_played": {"$max": "$created_at"}}},
        # Ties: more points first, then the player who got there earlier.
        {"$sort": {"points": -1, "last_played": 1}},
        {"$limit": limit},
    ]).to_list(limit)
    return Leaderboard(entries=[
        LeaderboardEntry(rank=i + 1, username=r["username"], points=r["points"], puzzles=r["puzzles"],
                         correct=r["correct"], last_played=r["last_played"].replace(tzinfo=timezone.utc))
        for i, r in enumerate(rows)
    ])
