"""
Auth routes: signup, login, verify-email, resend-otp, forgot/reset password, logout, /me.
"""
from __future__ import annotations

import asyncio
import csv
import io
import os
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
    record_and_send_auth_email,
    generate_random_password,
    send_random_password_email,
    EmailDeliveryError,
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


class CheckEmailRequest(BaseModel):
    email: str


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


async def _issue_otp(user_id: int, email: str, full_name: str, db: Any) -> dict:
    """Generate, store in database, and dispatch a new OTP via Azure / DB storage."""
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

    # Save to database auth_emails table and attempt email delivery
    delivery_info = {}
    try:
        delivery_info = await record_and_send_auth_email(user_id, email, otp, full_name, db)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Error in record_and_send_auth_email: {e}")

    delivery_info["otp"] = otp
    return delivery_info


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/check-email")
async def check_email_get(email: str, db: Any = Depends(get_db)):
    clean_email = email.lower().strip()
    user = await get_user_by_email(clean_email, db)
    return {
        "exists": user is not None,
        "email": clean_email,
        "message": "User exists" if user else "No account found with this email. Please sign up!"
    }


@router.post("/check-email")
async def check_email_post(payload: CheckEmailRequest, db: Any = Depends(get_db)):
    clean_email = payload.email.lower().strip()
    user = await get_user_by_email(clean_email, db)
    return {
        "exists": user is not None,
        "email": clean_email,
        "message": "User exists" if user else "No account found with this email. Please sign up!"
    }


@router.post("/signup")
async def signup(payload: SignupRequest, db: Any = Depends(get_db)):
    email = payload.email.lower().strip()
    existing = await get_user_by_email(email, db)
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    role = payload.role.upper()
    if role not in ("VENDOR", "END_CUSTOMER", "SUPER_ADMIN", "VENDOR_ADMIN"):
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
    otp_info = await _issue_otp(user["id"], email, full_name, db)

    resp_data = {
        "message": "Account created. A one-time email verification code has been sent to your email address.",
        "email": email,
        "needs_verification": True,
    }
    # Provide dev_otp fallback on Render or if SMTP delivery was skipped/stored
    is_render = bool(os.getenv("RENDER") or os.getenv("RENDER_SERVICE_ID"))
    if is_render or not otp_info.get("delivered", False):
        resp_data["dev_otp"] = otp_info.get("otp")
        resp_data["message"] = f"Account created! Your verification code is: {otp_info.get('otp')}"
    return resp_data


@router.post("/login")
async def login(
    payload: LoginRequest,
    response: Response,
    db: Any = Depends(get_db),
):
    try:
        email = payload.email.lower().strip()
        user = await get_user_by_email(email, db)

        if not user:
            raise HTTPException(
                status_code=401,
                detail="No account found with this email in our database. Please sign up first."
            )

        if not verify_password(payload.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        if not user["email_verified"]:
            # Re-send OTP if not yet verified
            full_name = user["full_name"]
            await _issue_otp(user["id"], email, full_name, db)
            return {
                "message": "Email not yet verified. A one-time verification code has been sent to your email address.",
                "needs_verification": True,
                "email": email,
            }

        # Check for existing active tenant
        tenant = await get_active_tenant_for_user(user["id"], db)

        # If tenant has saved tenant_id, client_id, and client_secret, refresh Azure tokens automatically
        mgmt_token = None
        graph_token = None
        c_sec = str(tenant.get("client_secret") or "") if tenant else ""
        if tenant and tenant.get("tenant_id") and tenant.get("client_id") and c_sec and not c_sec.startswith("*"):
            try:
                from app.services.azure.auth_service import AzureAuthService
                auth_service = AzureAuthService()
                m_data = await auth_service.get_access_token(
                    tenant_id=tenant["tenant_id"],
                    client_id=tenant["client_id"],
                    client_secret=tenant["client_secret"],
                    scope="https://management.azure.com/.default"
                )
                g_data = await auth_service.get_access_token(
                    tenant_id=tenant["tenant_id"],
                    client_id=tenant["client_id"],
                    client_secret=tenant["client_secret"],
                    scope="https://graph.microsoft.com/.default"
                )
                mgmt_token = m_data.get("access_token") if isinstance(m_data, dict) else m_data
                graph_token = g_data.get("access_token") if isinstance(g_data, dict) else g_data
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Could not auto-generate Azure tokens: {e}")

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
            "redirect": "/dashboard" if tenant else "/tent",
            "tenant": {
                "tenant_id": tenant["tenant_id"],
                "client_id": tenant.get("client_id"),
                "tenant_name": tenant.get("tenant_name"),
                "provider_name": tenant.get("provider_name"),
            } if tenant else None,
            "tokens": {
                "mgmt_token": mgmt_token,
                "graph_token": graph_token,
            } if (mgmt_token or graph_token) else None,
            "session_token": session_token,  # Also return in body for SPA sessionStorage fallback
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        import logging
        logging.getLogger(__name__).error(f"Login unexpected exception: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {type(e).__name__}: {str(e)}"
        )


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

    # Auto-generate tokens if tenant credentials exist
    mgmt_token = None
    graph_token = None
    c_sec = str(tenant.get("client_secret") or "") if tenant else ""
    if tenant and tenant.get("tenant_id") and tenant.get("client_id") and c_sec and not c_sec.startswith("*"):
        try:
            from app.services.azure.auth_service import AzureAuthService
            auth_service = AzureAuthService()
            m_data = await auth_service.get_access_token(
                tenant_id=tenant["tenant_id"],
                client_id=tenant["client_id"],
                client_secret=tenant["client_secret"],
                scope="https://management.azure.com/.default"
            )
            g_data = await auth_service.get_access_token(
                tenant_id=tenant["tenant_id"],
                client_id=tenant["client_id"],
                client_secret=tenant["client_secret"],
                scope="https://graph.microsoft.com/.default"
            )
            mgmt_token = m_data.get("access_token") if isinstance(m_data, dict) else m_data
            graph_token = g_data.get("access_token") if isinstance(g_data, dict) else g_data
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Could not auto-generate Azure tokens on verify: {e}")

    return {
        "message": "Email verified successfully.",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
        },
        "has_tenant": tenant is not None,
        "redirect": "/dashboard" if tenant else "/tent",
        "tenant": {
            "tenant_id": tenant["tenant_id"],
            "client_id": tenant.get("client_id"),
            "tenant_name": tenant.get("tenant_name"),
            "provider_name": tenant.get("provider_name"),
        } if tenant else None,
        "tokens": {
            "mgmt_token": mgmt_token,
            "graph_token": graph_token,
        } if (mgmt_token or graph_token) else None,
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

    otp_info = await _issue_otp(user["id"], email, user["full_name"], db)
    resp_data = {
        "message": "A new verification code has been sent to your email address.",
        "email": email,
    }
    is_render = bool(os.getenv("RENDER") or os.getenv("RENDER_SERVICE_ID"))
    if is_render or not otp_info.get("delivered", False):
        resp_data["dev_otp"] = otp_info.get("otp")
        resp_data["message"] = f"New verification code: {otp_info.get('otp')}"
    return resp_data


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: Any = Depends(get_db)):
    email = payload.email.lower().strip()
    user = await get_user_by_email(email, db)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found with this email address in our database."
        )

    # User exists in our database! Generate one secure random password
    new_random_password = generate_random_password(10)
    new_pw_hash = hash_password(new_random_password)

    # Update user password in database
    await db.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (new_pw_hash, user["id"]),
    )
    await db.commit()

    # Send the random password to the user's email
    await send_random_password_email(
        user_id=user["id"],
        to_email=email,
        new_password=new_random_password,
        full_name=user["full_name"],
        db=db,
    )

    return {
        "message": f"A new temporary password has been sent to {email}. Please check your inbox and use it to sign in.",
        "email": email,
    }


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
        "user_id": user.get("user_id"),
        "full_name": user["full_name"],
        "email": user["email"],
        "role": user["role"],
        "phone": user.get("phone"),
        "organization": user.get("organization"),
        "customer": user.get("customer"),
        "vendor_code": user.get("vendor_code"),
        "account_status": user.get("account_status", "active"),
        "email_verified": bool(user["email_verified"]),
        "created_at": str(user.get("created_at", "")),
        "has_tenant": tenant is not None,
        "tenant": dict(tenant) if tenant else None,
    }


@router.get("/latest-email")
async def get_latest_auth_email(email: str, db: Any = Depends(get_db)):
    """
    Returns the latest authentication email stored in the database for this recipient.
    Guarantees that authentication emails from noreply@cybaemtech.com are available.
    """
    clean_email = email.lower().strip()
    async with db.execute(
        """
        SELECT id, recipient_email as "to", sender_email as "from", subject,
               otp_code as otp, html_body as html, plain_body as text,
               created_at, delivery_status, delivery_method
        FROM auth_emails
        WHERE LOWER(recipient_email) = ?
        ORDER BY created_at DESC LIMIT 1
        """,
        (clean_email,),
    ) as cur:
        row = await cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="No email found in database for this address.")
    return dict(row)


@router.get("/admin/users", summary="List all sign-up users with full live details for Admin Panel")
async def get_all_users_admin(db: Any = Depends(get_db)):
    """
    Returns all real sign-up accounts from PostgreSQL/database with
    verification status, phone, organization, role, tenant link, and activity logs.
    """
    async with db.execute(
        """
        SELECT 
            u.id,
            u.user_id,
            u.full_name,
            u.email,
            u.role,
            u.phone,
            u.organization,
            u.customer,
            u.vendor_code,
            u.email_verified,
            u.account_status,
            u.created_at,
            u.updated_at,
            t.tenant_name,
            t.tenant_id as azure_tenant_id,
            o.display_name as org_display_name,
            o.primary_domain as org_domain,
            o.phone_number as org_phone,
            o.email as org_email,
            o.city as org_city,
            o.state as org_state,
            o.country as org_country,
            o.street as org_street,
            o.license as org_license,
            o.license_exp_date as org_license_exp_date,
            o.users_count as org_users_count,
            o.groups_count as org_groups_count,
            o.apps_count as org_apps_count,
            o.devices_count as org_devices_count,
            c.plan_tier as customer_plan_tier,
            c.license_exp_date as customer_license_exp_date,
            c.licenses_count as customer_licenses_count,
            ev.verified_at,
            ev.attempts as verification_attempts,
            (SELECT COUNT(*) FROM login_sessions s WHERE s.user_id = u.id AND s.revoked_at IS NULL) as active_sessions_count,
            (SELECT COUNT(*) FROM auth_emails ae WHERE LOWER(ae.recipient_email) = LOWER(u.email)) as emails_sent_count
        FROM users u
        LEFT JOIN user_tenants ut ON ut.user_id = u.id
        LEFT JOIN tenants t ON t.id = ut.tenant_id
        LEFT JOIN organizations o ON o.tenant_id = t.tenant_id
        LEFT JOIN customers c ON c.tenant_id = t.tenant_id
        LEFT JOIN email_verifications ev ON ev.user_id = u.id
        ORDER BY u.id DESC
        """
    ) as cur:
        rows = await cur.fetchall()

    users_list = []
    total_users = 0
    end_customers = 0
    vendors = 0
    super_admins = 0
    email_verified = 0
    pending_verification = 0
    active_sessions = 0

    seen_ids = set()
    for r in rows or []:
        uid = r["id"]
        if uid in seen_ids:
            continue
        seen_ids.add(uid)

        total_users += 1
        role_str = (r.get("role") or "END_CUSTOMER").upper()
        if "VENDOR" in role_str:
            vendors += 1
        elif "ADMIN" in role_str and role_str != "VENDOR_ADMIN":
            super_admins += 1
        else:
            end_customers += 1

        is_verified = bool(r.get("email_verified"))
        if is_verified:
            email_verified += 1
        else:
            pending_verification += 1

        sessions_cnt = int(r.get("active_sessions_count") or 0)
        active_sessions += sessions_cnt

        created_dt = r.get("created_at")
        updated_dt = r.get("updated_at")
        verified_dt = r.get("verified_at")

        # Check if user has connected and verified their Tenant ID
        azure_tenant = r.get("azure_tenant_id")
        has_tenant = bool(azure_tenant and str(azure_tenant).strip() != "")

        if has_tenant:
            # Live tenant details from linked organization
            display_phone = r.get("org_phone") or r.get("phone") or "—"
            display_org = r.get("org_display_name") or r.get("organization") or "—"

            cust_plan = r.get("customer_plan_tier") or ""
            org_lic = r.get("org_license") or ""

            if "Azure" in cust_plan:
                plan_name = "Cloud - Azure"
            elif "AWS" in cust_plan:
                plan_name = "Cloud - AWS"
            elif "GCP" in cust_plan:
                plan_name = "Cloud - GCP"
            elif "Office 365" in cust_plan or "Microsoft 365" in org_lic or "O365" in org_lic:
                plan_name = "Microsoft 365"
            else:
                plan_name = "Cloud - Azure"

            if "Gold" in cust_plan or "Gold" in org_lic:
                tier_name = "Gold"
            elif "Silver" in cust_plan or "Silver" in org_lic:
                tier_name = "Silver"
            elif "Bronze" in cust_plan or "Bronze" in org_lic:
                tier_name = "Bronze"
            elif "Trial" in cust_plan or "Trial" in org_lic:
                tier_name = "Trial"
            else:
                tier_name = "Gold"

            combined_plan_tier = f"{plan_name} ({tier_name})"

            exp_raw = r.get("customer_license_exp_date") or r.get("org_license_exp_date")
            if hasattr(exp_raw, "strftime"):
                clean_exp_date = exp_raw.strftime("%Y-%m-%d")
            elif exp_raw:
                clean_exp_date = str(exp_raw)[:10]
            else:
                clean_exp_date = "2027-11-11"
        else:
            # User has NOT verified/connected a Tenant ID - do not show tenant plan/expiry
            display_phone = r.get("phone") or "—"
            display_org = r.get("organization") or "—"
            plan_name = None
            tier_name = None
            combined_plan_tier = None
            clean_exp_date = None

        users_list.append({
            "id": uid,
            "user_id": r.get("user_id") or f"usr-{uid}",
            "full_name": r.get("full_name") or "User",
            "email": r.get("email"),
            "role": role_str,
            "phone": display_phone,
            "organization": display_org,
            "customer": r.get("customer"),
            "vendor_code": r.get("vendor_code") or "—",
            "email_verified": is_verified,
            "account_status": r.get("account_status") or "active",
            "created_at": created_dt.isoformat() if hasattr(created_dt, "isoformat") else str(created_dt or ""),
            "updated_at": updated_dt.isoformat() if hasattr(updated_dt, "isoformat") else str(updated_dt or ""),
            "verified_at": verified_dt.isoformat() if hasattr(verified_dt, "isoformat") else str(verified_dt or ""),
            "verification_attempts": int(r.get("verification_attempts") or 0),
            "tenant_name": r.get("tenant_name"),
            "azure_tenant_id": r.get("azure_tenant_id"),
            "has_tenant": has_tenant,
            "active_sessions_count": sessions_cnt,
            "emails_sent_count": int(r.get("emails_sent_count") or 0),
            # Plan, Tier, and Expiry ONLY provided if Tenant ID is verified
            "plan": plan_name,
            "tier": tier_name,
            "plan_tier": combined_plan_tier,
            "license_exp_date": clean_exp_date,
            # Organization enrichment from Azure Entra ID / tenant
            "org_display_name": r.get("org_display_name") if has_tenant else None,
            "org_domain": r.get("org_domain") if has_tenant else None,
            "org_phone": r.get("org_phone") if has_tenant else None,
            "org_email": r.get("org_email") if has_tenant else None,
            "org_city": r.get("org_city") if has_tenant else None,
            "org_state": r.get("org_state") if has_tenant else None,
            "org_country": r.get("org_country") if has_tenant else None,
            "org_street": r.get("org_street") if has_tenant else None,
            "org_license": r.get("org_license") if has_tenant else None,
            "org_license_exp_date": clean_exp_date if (has_tenant and r.get("org_license_exp_date")) else None,
            "org_users_count": r.get("org_users_count") if has_tenant else None,
            "org_groups_count": r.get("org_groups_count") if has_tenant else None,
            "org_apps_count": r.get("org_apps_count") if has_tenant else None,
            "org_devices_count": r.get("org_devices_count") if has_tenant else None,
        })

    return {
        "success": True,
        "stats": {
            "total_users": total_users,
            "end_customers": end_customers,
            "vendors": vendors,
            "super_admins": super_admins,
            "email_verified": email_verified,
            "pending_verification": pending_verification,
            "active_sessions": active_sessions,
        },
        "users": users_list,
    }


@router.get("/admin/users/export", summary="Export all sign-up users as CSV file")
async def export_all_users_admin_csv(db: Any = Depends(get_db)):
    """
    Returns a downloadable CSV file containing all sign-up users, roles, contact numbers,
    separate plan and tier values, license expiration, and tenant details.
    """
    res = await get_all_users_admin(db=db)
    user_list = res.get("users", [])

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "User ID",
        "Full Name",
        "Email",
        "Role",
        "Phone",
        "Organization",
        "Email Verification",
        "Plan",
        "Tier",
        "Plan & Tier",
        "License Expiration",
        "Connected Tenant",
        "Azure Tenant ID",
        "Active Sessions",
        "Emails Sent",
        "Registered At"
    ])
    for u in user_list:
        writer.writerow([
            u.get("user_id"),
            u.get("full_name"),
            u.get("email"),
            u.get("role"),
            u.get("phone"),
            u.get("organization"),
            "VERIFIED" if u.get("email_verified") else "PENDING_OTP",
            u.get("plan"),
            u.get("tier"),
            u.get("plan_tier"),
            u.get("license_exp_date"),
            u.get("tenant_name") or "",
            u.get("azure_tenant_id") or "",
            u.get("active_sessions_count", 0),
            u.get("emails_sent_count", 0),
            u.get("created_at")
        ])

    csv_data = "\ufeff" + output.getvalue()
    today_str = datetime.now().strftime("%Y-%m-%d")
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="zensustech_users_export_{today_str}.csv"'
        }
    )



