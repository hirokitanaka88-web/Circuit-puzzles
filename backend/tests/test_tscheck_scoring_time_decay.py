"""Server-scored first check with time decay (seed=6, series_parallel: E=60, R1=10, R2=25, R3=5, R4=15)."""
import uuid

import pytest


def test_scoring_first_check_awards_points_then_locks(client):
    suffix = uuid.uuid4().hex[:6]
    username = f"tscheck-score-{suffix}"

    # sign in (creates the player)
    r = client.post("/auth/login", json={"username": username, "pin": "1357"})
    assert r.status_code == 200, r.text
    token = r.headers["set-cookie"].split("session=", 1)[1].split(";", 1)[0]
    headers = {"Cookie": f"session={token}"}  # "session" cookie is Secure-only; attach manually over http

    # fetch a deterministic puzzle via seed — no solution/steps leaked
    r = client.get("/puzzles/new", params={"seed": 6, "topology": "series_parallel"})
    assert r.status_code == 200, r.text
    puzzle = r.json()
    assert "solution" not in puzzle and "steps" not in puzzle
    assert puzzle["given"]["R1"] == 10 and puzzle["given"]["E"] == 180
    assert set(puzzle["given_cells"]) == {"R-R1", "R-R2", "R-R3", "R-R4", "E-Total"}
    puzzle_id = puzzle["id"]

    # hand-solved values for the 15 non-given cells (seed=6: E=180,R1=10,R2=25,R3=5,R4=15 ->
    # R23=30, Rp=10, RT=20, IT=9, E1=90, Ep=E4=90, I23=3, I4=6, E2=75, E3=15)
    answers = {
        "E-R1": "90", "E-R2": "75", "E-R3": "15", "E-R4": "90",
        "I-Total": "9", "I-R1": "9", "I-R2": "3", "I-R3": "3", "I-R4": "6",
        "R-Total": "20",
        "W-Total": "1620", "W-R1": "810", "W-R2": "225", "W-R3": "45", "W-R4": "540",
    }

    r = client.post(f"/puzzles/{puzzle_id}/check", json={"answers": answers}, headers=headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["correct"] == 15 and body["total"] == 15
    assert body["score"]["status"] == "awarded"
    assert body["score"]["points"] == 150  # 15 correct * 10 pts, within the 2-minute full-points window

    # second check (even with the same correct answers) must NOT re-score — score is locked
    r2 = client.post(f"/puzzles/{puzzle_id}/check", json={"answers": answers}, headers=headers)
    body2 = r2.json()
    assert body2["score"]["status"] == "already_locked"
    assert body2["score"]["points"] == 150

    # leaderboard reflects the awarded points for this fresh player
    r3 = client.get("/leaderboard", params={"limit": 100})
    assert r3.status_code == 200
    entries = {e["username"]: e for e in r3.json()["entries"]}
    assert username in entries
    assert entries[username]["points"] == 150
    assert entries[username]["puzzles"] == 1
