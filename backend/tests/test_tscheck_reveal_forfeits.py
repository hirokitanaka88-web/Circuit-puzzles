"""Revealing the solution before the score is locked forfeits that puzzle's points."""
import uuid


def test_reveal_then_check_awards_zero_points(client):
    suffix = uuid.uuid4().hex[:6]
    username = f"tscheck-rvl-{suffix}"

    r = client.post("/auth/login", json={"username": username, "pin": "2468"})
    assert r.status_code == 200, r.text
    token = r.headers["set-cookie"].split("session=", 1)[1].split(";", 1)[0]
    headers = {"Cookie": f"session={token}"}

    r = client.get("/puzzles/new", params={"seed": 6, "topology": "series_parallel"})
    assert r.status_code == 200, r.text
    puzzle = r.json()
    puzzle_id = puzzle["id"]

    # reveal before any check — returns full solution + steps and marks the puzzle revealed
    rr = client.post(f"/puzzles/{puzzle_id}/reveal")
    assert rr.status_code == 200, rr.text
    reveal_body = rr.json()
    assert "solution" in reveal_body and "steps" in reveal_body
    assert len(reveal_body["solution"]) == 5  # Total + R1..R4
    assert len(reveal_body["steps"]) > 0

    # correct answers (same hand-solved values as the scoring test) now score 0, status "revealed"
    answers = {
        "E-R1": "90", "E-R2": "75", "E-R3": "15", "E-R4": "90",
        "I-Total": "9", "I-R1": "9", "I-R2": "3", "I-R3": "3", "I-R4": "6",
        "R-Total": "20",
        "W-Total": "1620", "W-R1": "810", "W-R2": "225", "W-R3": "45", "W-R4": "540",
    }
    r2 = client.post(f"/puzzles/{puzzle_id}/check", json={"answers": answers}, headers=headers)
    assert r2.status_code == 200, r2.text
    body = r2.json()
    assert body["correct"] == 15  # grading itself still works
    assert body["score"]["status"] == "revealed"
    assert body["score"]["points"] == 0

    # leaderboard must NOT have gained points for this puzzle (player never appears, 0 scored puzzles)
    lb = client.get("/leaderboard", params={"limit": 100}).json()
    assert username not in {e["username"] for e in lb["entries"]}
