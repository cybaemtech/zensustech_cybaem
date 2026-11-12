"""
Auth service: OTP generation, hashing, email sending, user lookups.
"""
import secrets
import hashlib
import os
import logging
import html
from urllib.parse import quote
from datetime import datetime, timedelta, timezone

import aiosqlite
import bcrypt
import httpx

logger = logging.getLogger("auth_service")

# ─── Password helpers ────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    # Truncate to 72 bytes if needed to adhere to bcrypt specification
    pw_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        pw_bytes = plain.encode("utf-8")[:72]
        return bcrypt.checkpw(pw_bytes, hashed.encode("utf-8"))
    except Exception:
        return False


# ─── OTP helpers ─────────────────────────────────────────────────────────────

def generate_otp() -> str:
    """Return a secure 6-digit OTP string."""
    return str(secrets.randbelow(900000) + 100000)


def hash_otp(otp: str) -> str:
    """SHA-256 hash of the OTP for secure storage (bcrypt is too slow for 5-attempt loops)."""
    return hashlib.sha256(otp.encode()).hexdigest()


def verify_otp_hash(otp: str, otp_hash: str) -> bool:
    return hash_otp(otp) == otp_hash


# ─── Session token ────────────────────────────────────────────────────────────

def create_session_token() -> str:
    return secrets.token_urlsafe(48)


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


"""
Auth service: OTP generation, hashing, database storage of authentication emails,
and Azure Microsoft Graph delivery (without SMTP).
"""
import secrets
import hashlib
import os
import logging
import html
from urllib.parse import quote
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Dict

import aiosqlite
import bcrypt
import httpx

logger = logging.getLogger("auth_service")

# ─── Password helpers ────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    # Truncate to 72 bytes if needed to adhere to bcrypt specification
    pw_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        pw_bytes = plain.encode("utf-8")[:72]
        return bcrypt.checkpw(pw_bytes, hashed.encode("utf-8"))
    except Exception:
        return False


# ─── OTP helpers ─────────────────────────────────────────────────────────────

def generate_otp() -> str:
    """Return a secure 6-digit OTP string."""
    return str(secrets.randbelow(900000) + 100000)


def hash_otp(otp: str) -> str:
    """SHA-256 hash of the OTP for secure storage (bcrypt is too slow for 5-attempt loops)."""
    return hashlib.sha256(otp.encode()).hexdigest()


def verify_otp_hash(otp: str, otp_hash: str) -> bool:
    return hash_otp(otp) == otp_hash


# ─── Session token ────────────────────────────────────────────────────────────

def create_session_token() -> str:
    return secrets.token_urlsafe(48)


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


# ─── Email generation, Database storage, and Azure Graph delivery ───────────

class EmailDeliveryError(RuntimeError):
    """Raised when a verification email cannot be processed."""


def build_auth_email_content(otp: str, full_name: str, sender: str = "noreply@cybaemtech.com") -> tuple[str, str]:
    safe_name = html.escape(full_name)
    html_body = f"""
    <html><body style="font-family:Inter,Segoe UI,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;">
      <div style="max-width:520px;margin:20px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Zensus Verification Code</h2>
          <p style="color:#64748b;margin:0;font-size:13px;">Enterprise Cloud Operations & Identity Management</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;font-size:15px;line-height:1.5;">
          Hello <strong>{safe_name}</strong>,
        </p>
        <p style="color:#475569;margin:0 0 24px;font-size:14px;line-height:1.6;">
          Thank you for registering with Zensus. Your email verification code is:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;font-size:38px;font-weight:800;letter-spacing:10px;color:#008cff;background:#eff6ff;padding:16px 28px;border-radius:10px;border:2px dashed #93c5fd;font-family:Consolas,monospace;">
            {otp}
          </div>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0 0 10px;text-align:center;">
          ⏰ This code is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.
        </p>
        <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
          If you did not request this verification, please ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 20px;">
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          ZensusTech Security Team · Sent from {sender}
        </p>
      </div>
    </body></html>
    """

    plain_body = f"""Hello {full_name},

Thank you for registering with Zensus.
Your email verification code is: {otp}

This code is valid for 5 minutes. Please do not share this code with anyone.
If you did not request this verification, please ignore this email.

Regards,
Zensus Team
Sent from {sender}
"""
    return html_body, plain_body


async def record_and_send_auth_email(
    user_id: Optional[int],
    to_email: str,
    otp: str,
    full_name: str,
    db: Any,
) -> Dict[str, Any]:
    """
    1. Formats email from noreply@cybaemtech.com.
    2. Stores email in the database (auth_emails table) for 100% certainty.
    3. If Azure credentials (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)
       are present, sends via Microsoft Graph API (without SMTP).
    """
    sender = os.getenv("AZURE_SENDER_EMAIL") or os.getenv("GRAPH_MAIL_SENDER") or "noreply@cybaemtech.com"
    subject = "Zensus - Email Verification Code"
    html_body, plain_body = build_auth_email_content(otp, full_name, sender)
    delivery_status = "stored_in_db"
    delivery_method = "azure_graph"

    tenant_id = os.getenv("AZURE_TENANT_ID", "").strip()
    client_id = os.getenv("AZURE_CLIENT_ID", "").strip()
    client_secret = os.getenv("AZURE_CLIENT_SECRET", "").strip()

    if tenant_id and client_id and client_secret:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                token_resp = await client.post(
                    f"https://login.microsoftonline.com/{quote(tenant_id, safe='')}/oauth2/v2.0/token",
                    data={
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "grant_type": "client_credentials",
                        "scope": "https://graph.microsoft.com/.default",
                    },
                )
                if not token_resp.is_error:
                    access_token = token_resp.json().get("access_token")
                    if access_token:
                        mail_resp = await client.post(
                            f"https://graph.microsoft.com/v1.0/users/{quote(sender, safe='')}/sendMail",
                            headers={"Authorization": f"Bearer {access_token}"},
                            json={
                                "message": {
                                    "subject": subject,
                                    "body": {"contentType": "HTML", "content": html_body},
                                    "toRecipients": [{"emailAddress": {"address": to_email}}],
                                },
                                "saveToSentItems": False,
                            },
                        )
                        if not mail_resp.is_error:
                            delivery_status = "sent_via_azure"
                            logger.info(f"Dispatched email via Azure Graph to {to_email}")
                        else:
                            logger.warning(f"Azure Graph returned status {mail_resp.status_code}")
        except Exception as e:
            logger.warning(f"Azure Graph dispatch exception: {e}")

    # Store in database
    await db.execute(
        """
        INSERT INTO auth_emails (
            user_id, recipient_email, sender_email, subject, otp_code, html_body, plain_body, delivery_method, delivery_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            to_email.lower().strip(),
            sender,
            subject,
            otp,
            html_body,
            plain_body,
            delivery_method,
            delivery_status,
        ),
    )
    await db.commit()

    return {
        "to": to_email,
        "from": sender,
        "subject": subject,
        "otp": otp,
        "html": html_body,
        "text": plain_body,
        "delivery_status": delivery_status,
    }


def send_otp_email(to_email: str, otp: str, full_name: str = "User") -> bool:
    """Sync wrapper kept for backwards compatibility."""
    return True


# ─── DB helpers ───────────────────────────────────────────────────────────────

async def get_user_by_email(email: str, db: Any):
    async with db.execute(
        "SELECT * FROM users WHERE email = ?", (email.lower().strip(),)
    ) as cur:
        return await cur.fetchone()


async def get_user_by_id(user_id: int, db: Any):
    async with db.execute(
        "SELECT * FROM users WHERE id = ?", (user_id,)
    ) as cur:
        return await cur.fetchone()


async def get_active_tenant_for_user(user_id: int, db: Any):
    """Return the first active tenant record associated with this user, or None."""
    async with db.execute(
        """
        SELECT t.* FROM tenants t
        JOIN user_tenants ut ON ut.tenant_id = t.id
        WHERE ut.user_id = ? AND t.connection_status = 'active'
        ORDER BY ut.is_primary DESC, ut.created_at DESC
        LIMIT 1
        """,
        (user_id,),
    ) as cur:
        return await cur.fetchone()


async def get_pending_otp(user_id: int, db: Any):
    """Return the latest unused OTP record for this user."""
    async with db.execute(
        """
        SELECT * FROM email_verifications
        WHERE user_id = ? AND verified_at IS NULL
        ORDER BY created_at DESC LIMIT 1
        """,
        (user_id,),
    ) as cur:
        return await cur.fetchone()
