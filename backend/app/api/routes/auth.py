"""
Auth routes: signup, login, verify-email, resend-otp, forgot/reset password, logout, /me.
"""
from __future__ import annotations

import asyncio
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Any

import aiosqlite
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr

from app.db.database import get_db
from app.api.services.auth_service import (
    get_user_by_email,
    get_user_by_id,
    get_active_tenant_for_user,
    get_pending_otp,
    hash_password,
    verify_password,
    generate_otp,
    hash_otp,
    verify_otp_hash,
    create_session_token,
    hash_session_token,
    send_otp_email,
    is_live_email_configured,
    get_latest_email,
)
from app.core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["00 · User Auth"])

SESSION_TTL_HOURS = 24
OTP_TTL_MINUTES = 5
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60


# ─── Request / Response models ────────────────────────────────────────────────

class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    role: str = "END_CUSTOMER"          # VENDOR | END_CUSTOMER
    phone: Optional[str] = None
    organization: Optional[str] = None
    customer: Optional[str] = None
    vendor_code: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class VerifyOtpRequest(BaseModel):
    email: str
    otp: str


class ResendOtpRequest(BaseModel):
    email: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str


# ─── Helper ───────────────────────────────────────────────────────────────────

def _now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def _now_plus(minutes: int = 0, hours: int = 0) -> str:
    return (datetime.now(timezone.utc) + timedelta(minutes=minutes, hours=hours)).isoformat()


def _is_expired(ts: Any) -> bool:
    try:
        if isinstance(ts, datetime):
            dt = ts
        else:
            dt = datetime.fromisoformat(str(ts))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt < datetime.now(timezone.utc)
    except Exception:
        return True


async def _create_session(user_id: int, db: aiosqlite.Connection) -> str:
    token = create_session_token()
    token_hash = hash_session_token(token)
    expires_at = _now_plus(hours=SESSION_TTL_HOURS)
    await db.execute(
        "INSERT INTO login_sessions (user_id, session_token_hash, expires_at) VALUES (?, ?, ?)",
        (user_id, token_hash, expires_at),
    )
    await db.commit()
    return token


async def _get_session_user(request: Request, db: aiosqlite.Connection):
    token = request.cookies.get("zt_session") or request.headers.get("X-ZT-Session")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token_hash = hash_session_token(token)
    async with db.execute(
        """
        SELECT s.user_id, s.expires_at, s.revoked_at
        FROM login_sessions s
        WHERE s.session_token_hash = ?
        """,
        (token_hash,),
    ) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid session")
    if row["revoked_at"] or _is_expired(row["expires_at"]):
        raise HTTPException(status_code=401, detail="Session expired")
    return row["user_id"]


async def _issue_otp(user_id: int, email: str, full_name: str, db: aiosqlite.Connection):
    """Generate, store, and email a new OTP. Invalidates previous OTPs."""
    # Invalidate any previous OTPs
    await db.execute(
        "DELETE FROM email_verifications WHERE user_id = ? AND verified_at IS NULL",
        (user_id,),
    )
    otp = generate_otp()
    otp_hash = hash_otp(otp)
    expires_at = _now_plus(minutes=OTP_TTL_MINUTES)
    await db.execute(
        "INSERT INTO email_verifications (user_id, otp_hash, expires_at) VALUES (?, ?, ?)",
        (user_id, otp_hash, expires_at),
    )
    await db.commit()
    # Send email in background (don't block the response)
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, send_otp_email, email, otp, full_name)
    return otp  # returned only for dev-mode; don't expose in prod responses


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/signup")
async def signup(payload: SignupRequest, db: Any = Depends(get_db)):
    email = payload.email.lower().strip()
    existing = await get_user_by_email(email, db)
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    role = payload.role.upper()
    if role not in ("VENDOR", "END_CUSTOMER", "SUPER_ADMIN"):
        role = "END_CUSTOMER"

    full_name = f"{payload.first_name.strip()} {payload.last_name.strip()}"
    pw_hash = hash_password(payload.password)
    user_id_str = f"usr-{secrets.token_hex(6)}"

    await db.execute(
        """
        INSERT INTO users
            (user_id, full_name, email, password_hash, role, phone, organization, customer, vendor_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id_str, full_name, email, pw_hash, role,
            payload.phone, payload.organization,
            payload.customer, payload.vendor_code,
        ),
    )
    await db.commit()

    # Fetch the new user to get its id
    user = await get_user_by_email(email, db)
    await _issue_otp(user["id"], email, full_name, db)

    return {
        "message": "Account created. A verification code has been sent to your email address.",
        "email": email,
        "needs_verification": True,
    }


@router.post("/login")
async def login(
    payload: LoginRequest,
    response: Response,
    db: Any = Depends(get_db),
):
    email = payload.email.lower().strip()
    user = await get_user_by_email(email, db)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user["email_verified"]:
        # Re-send OTP if not yet verified
        full_name = user["full_name"]
        await _issue_otp(user["id"], email, full_name, db)
        return {
            "message": "Email not yet verified. A new verification code has been sent to your email address.",
            "needs_verification": True,
            "email": email,
        }

    # Check for existing active tenant
    tenant = await get_active_tenant_for_user(user["id"], db)

    session_token = await _create_session(user["id"], db)
    response.set_cookie(
        "zt_session",
        session_token,
        httponly=True,
        samesite="lax",
        secure=False,  # Set True in production with HTTPS
        max_age=SESSION_TTL_HOURS * 3600,
    )

    return {
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
        },
        "has_tenant": tenant is not None,
        "needs_tenant": tenant is None,
        "redirect": "/dashboard" if tenant else "/connect-tenant",
        "session_token": session_token,  # Also return in body for SPA sessionStorage fallback
    }


@router.post("/verify-email")
async def verify_email(
    payload: VerifyOtpRequest,
    response: Response,
    db: Any = Depends(get_db),
):
    email = payload.email.lower().strip()
    user = await get_user_by_email(email, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    otp_record = await get_pending_otp(user["id"], db)
    if not otp_record:
        raise HTTPException(status_code=400, detail="No pending OTP found. Please request a new one.")

    if _is_expired(otp_record["expires_at"]):
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    if otp_record["attempts"] >= OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Maximum OTP attempts reached. Please request a new one.")

    # Increment attempt counter
    await db.execute(
        "UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?",
        (otp_record["id"],),
    )
    await db.commit()

    if not verify_otp_hash(payload.otp.strip(), otp_record["otp_hash"]):
        remaining = OTP_MAX_ATTEMPTS - (otp_record["attempts"] + 1)
        raise HTTPException(
            status_code=400,
            detail=f"Invalid OTP. {remaining} attempt(s) remaining.",
        )

    # Mark OTP verified & user email_verified
    now = _now_utc()
    await db.execute(
        "UPDATE email_verifications SET verified_at = ? WHERE id = ?",
        (now, otp_record["id"]),
    )
    await db.execute(
        "UPDATE users SET email_verified = TRUE, updated_at = ? WHERE id = ?",
        (now, user["id"]),
    )
    await db.commit()

    # Issue session
    session_token = await _create_session(user["id"], db)
    response.set_cookie(
        "zt_session",
        session_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=SESSION_TTL_HOURS * 3600,
    )

    # Check tenant
    tenant = await get_active_tenant_for_user(user["id"], db)

    return {
        "message": "Email verified successfully.",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
        },
        "has_tenant": tenant is not None,
        "redirect": "/dashboard" if tenant else "/connect-tenant",
        "session_token": session_token,
    }


@router.post("/resend-otp")
async def resend_otp(payload: ResendOtpRequest, db: Any = Depends(get_db)):
    email = payload.email.lower().strip()
    user = await get_user_by_email(email, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user["email_verified"]:
        raise HTTPException(status_code=400, detail="Email is already verified.")

    # Enforce 60-second cooldown
    otp_record = await get_pending_otp(user["id"], db)
    if otp_record:
        raw_created = otp_record["created_at"]
        if isinstance(raw_created, datetime):
            created = raw_created
        else:
            created = datetime.fromisoformat(str(raw_created))
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        elapsed = (datetime.now(timezone.utc) - created).total_seconds()
        if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
            wait = int(OTP_RESEND_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {wait} seconds before requesting a new OTP.",
            )

    await _issue_otp(user["id"], email, user["full_name"], db)
    return {
        "message": "A new verification code has been sent to your email address.",
    }


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: Any = Depends(get_db)):
    email = payload.email.lower().strip()
    user = await get_user_by_email(email, db)
    if user:
        await _issue_otp(user["id"], email, user["full_name"], db)
    return {"message": "If that email is registered, a password reset OTP has been sent."}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: Any = Depends(get_db)):
    email = payload.email.lower().strip()
    user = await get_user_by_email(email, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    otp_record = await get_pending_otp(user["id"], db)
    if not otp_record or _is_expired(str(otp_record["expires_at"])):
        raise HTTPException(status_code=400, detail="OTP expired or not found. Please request a new one.")

    if not verify_otp_hash(payload.otp.strip(), otp_record["otp_hash"]):
        raise HTTPException(status_code=400, detail="Invalid OTP.")

    new_hash = hash_password(payload.new_password)
    now = _now_utc()
    await db.execute(
        "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
        (new_hash, now, user["id"]),
    )
    await db.execute(
        "UPDATE email_verifications SET verified_at = ? WHERE id = ?",
        (now, otp_record["id"]),
    )
    await db.commit()
    return {"message": "Password reset successfully. Please log in with your new password."}


@router.post("/logout")
async def logout(request: Request, response: Response, db: Any = Depends(get_db)):
    token = request.cookies.get("zt_session") or request.headers.get("X-ZT-Session")
    if token:
        token_hash = hash_session_token(token)
        await db.execute(
            "UPDATE login_sessions SET revoked_at = ? WHERE session_token_hash = ?",
            (_now_utc(), token_hash),
        )
        await db.commit()
    response.delete_cookie("zt_session")
    return {"message": "Logged out successfully."}


@router.get("/me")
async def get_me(request: Request, db: Any = Depends(get_db)):
    user_id = await _get_session_user(request, db)
    user = await get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    tenant = await get_active_tenant_for_user(user_id, db)
    return {
        "id": user["id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "role": user["role"],
        "email_verified": bool(user["email_verified"]),
        "has_tenant": tenant is not None,
        "tenant": dict(tenant) if tenant else None,
    }


@router.get("/latest-email")
async def get_latest_email_endpoint(email: str):
    """
    Returns the latest formatted normal HTML email from noreply@cybaemtech.com
    for this recipient, allowing in-app preview without requiring an SMTP password.
    """
    clean_email = email.lower().strip()
    msg = get_latest_email(clean_email)
    if not msg:
        raise HTTPException(status_code=404, detail="No email found for this address.")
    return msg


