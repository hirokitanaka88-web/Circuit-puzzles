"""Username + PIN players. Signing in with a new username creates it; sessions are httpOnly cookies."""
import secrets
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Cookie, HTTPException, Response
from passlib.context import CryptContext

from lib.db import db
from models.users import LoginRequest, User

router = APIRouter(prefix="/auth", tags=["auth"])
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
COOKIE = "session"
MAX_AGE = 180 * 24 * 3600


async def current_user(session: Optional[str]) -> Optional[User]:
    if not session:
        return None
    s = await db.sessions.find_one({"token": session})
    if not s:
        return None
    u = await db.users.find_one({"id": s["user_id"]})
    return User(id=u["id"], username=u["username"]) if u else None


@router.post("/login", response_model=User)
async def login(body: LoginRequest, response: Response):
    name = " ".join(body.username.split())
    if len(name) < 3:
        raise HTTPException(status_code=422, detail="Username must be at least 3 characters")
    u = await db.users.find_one({"username_lower": name.lower()})
    if u:
        if not pwd.verify(body.pin, u["pin_hash"]):
            raise HTTPException(status_code=401, detail="That username is taken and the PIN doesn't match")
    else:
        u = {"id": str(uuid.uuid4()), "username": name, "username_lower": name.lower(),
             "pin_hash": pwd.hash(body.pin), "created_at": datetime.now(timezone.utc)}
        try:
            await db.users.insert_one(u)
        except Exception:  # lost a race on the unique index
            raise HTTPException(status_code=409, detail="That username was just taken — try again")
    token = secrets.token_urlsafe(32)
    await db.sessions.insert_one({"token": token, "user_id": u["id"], "created_at": datetime.now(timezone.utc)})
    response.set_cookie(COOKIE, token, max_age=MAX_AGE, httponly=True, secure=True, samesite="lax", path="/")
    return User(id=u["id"], username=u["username"])


@router.get("/me", response_model=Optional[User])
async def me(session: Optional[str] = Cookie(default=None)):
    return await current_user(session)


@router.post("/logout")
async def logout(response: Response, session: Optional[str] = Cookie(default=None)):
    if session:
        await db.sessions.delete_one({"token": session})
    response.delete_cookie(COOKIE, path="/")
    return {"ok": True}
