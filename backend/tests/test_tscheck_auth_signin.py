"""Username + PIN auth: new username creates the player; existing username + wrong PIN is rejected."""
import uuid


def test_signup_then_wrong_pin_rejected(client):
    suffix = uuid.uuid4().hex[:6]
    username = f"tscheck-auth-{suffix}"

    # brand new username + PIN -> creates the player, sets session cookie
    r = client.post("/auth/login", json={"username": username, "pin": "9876"})
    assert r.status_code == 200, r.text
    assert r.json()["username"] == username
    token = r.headers["set-cookie"].split("session=", 1)[1].split(";", 1)[0]
    assert token

    # the "session" cookie is Secure (https-only); httpx on plain http won't resend it via the
    # jar, so attach it manually as the raw Cookie header to exercise the same auth path.
    headers = {"Cookie": f"session={token}"}
    me = client.get("/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["username"] == username

    # same username, wrong PIN -> 401, existing account untouched
    bad = client.post("/auth/login", json={"username": username, "pin": "0000"})
    assert bad.status_code == 401, bad.text

    # correct PIN still works (account wasn't corrupted by the failed attempt)
    ok = client.post("/auth/login", json={"username": username, "pin": "9876"})
    assert ok.status_code == 200
    assert ok.json()["username"] == username

    # logout clears the session
    out = client.post("/auth/logout", headers=headers)
    assert out.status_code == 200
    me2 = client.get("/auth/me", headers=headers)
    assert me2.json() is None
