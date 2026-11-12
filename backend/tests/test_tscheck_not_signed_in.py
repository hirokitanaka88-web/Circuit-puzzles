"""Anonymous (not signed-in) checks grade but never lock/score; signing in afterwards can still score the same puzzle."""
import uuid


def test_not_signed_in_then_sign_in_scores_same_puzzle(client):
    r = client.get("/puzzles/new", params={"seed": 6, "topology": "series_parallel"})
    assert r.status_code == 200, r.text
    puzzle_id = r.json()["id"]

    answers = {
        "E-R1": "90", "E-R2": "75", "E-R3": "15", "E-R4": "90",
        "I-Total": "9", "I-R1": "9", "I-R2": "3", "I-R3": "3", "I-R4": "6",
        "R-Total": "20",
        "W-Total": "1620", "W-R1": "810", "W-R2": "225", "W-R3": "45", "W-R4": "540",
    }

    # no session cookie at all -> grades, but does not lock and awards nothing
    r1 = client.post(f"/puzzles/{puzzle_id}/check", json={"answers": answers})
    assert r1.status_code == 200, r1.text
    body1 = r1.json()
    assert body1["correct"] == 15
    assert body1["score"]["status"] == "not_signed_in"
    assert body1["score"]["points"] == 0

    # sign in now and check the SAME puzzle again — it should score because nothing locked it before
    suffix = uuid.uuid4().hex[:6]
    username = f"tscheck-anon-{suffix}"
    login = client.post("/auth/login", json={"username": username, "pin": "1111"})
    assert login.status_code == 200, login.text
    token = login.headers["set-cookie"].split("session=", 1)[1].split(";", 1)[0]
    headers = {"Cookie": f"session={token}"}

    r2 = client.post(f"/puzzles/{puzzle_id}/check", json={"answers": answers}, headers=headers)
    assert r2.status_code == 200, r2.text
    body2 = r2.json()
    assert body2["score"]["status"] == "awarded"
    assert body2["score"]["points"] == 150

    # a third check (now locked) must not change the awarded points
    r3 = client.post(f"/puzzles/{puzzle_id}/check", json={"answers": answers}, headers=headers)
    assert r3.json()["score"]["status"] == "already_locked"
    assert r3.json()["score"]["points"] == 150
