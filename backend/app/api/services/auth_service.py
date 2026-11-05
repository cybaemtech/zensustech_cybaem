"""
Auth service: OTP generation, hashing, email sending, user lookups.
"""
import secrets
import hashlib
import smtplib
import os
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import aiosqlite
import bcrypt

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


# ─── Email ────────────────────────────────────────────────────────────────────

MAIL_HOST = os.getenv("MAIL_HOST", "smtp.gmail.com")
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
MAIL_USER = os.getenv("MAIL_USER", "")
MAIL_PASS = os.getenv("MAIL_PASS", "")
MAIL_FROM = os.getenv("MAIL_FROM", "no-reply@zensustech.com")


def send_otp_email(to_email: str, otp: str, full_name: str = "User") -> bool:
    """
    Send the OTP verification email. Returns True on success, False on failure.
    If MAIL_USER / MAIL_PASS are not configured the function logs and returns False
    without raising so the signup flow can still continue in dev.
    """
    if not MAIL_USER or not MAIL_PASS:
        # Dev mode: log the OTP to stdout so developers can test without SMTP
        print(f"[DEV OTP] To: {to_email}  OTP: {otp}")
        return True

    subject = "Zensus - Email Verification Code"
    html_body = f"""
    <html><body style="font-family:Inter,sans-serif;background:#f8fafc;margin:0;padding:0;">
      <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;">
        <h2 style="color:#0f172a;margin:0 0 8px;">Hello {full_name},</h2>
        <p style="color:#475569;margin:0 0 20px;font-size:14px;">
          Thank you for registering with <strong>ZensusTech</strong>.<br>
          Your email verification code is:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#008cff;background:#eff6ff;padding:16px 28px;border-radius:10px;border:2px dashed #93c5fd;">
            {otp}
          </span>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0 0 8px;">
          ⏰ This code is valid for <strong>5 minutes</strong>.
        </p>
        <p style="color:#94a3b8;font-size:12px;">
          If you did not request this verification, please ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="color:#94a3b8;font-size:11px;margin:0;">
          © ZensusTech Cloud Operations · Secure · Enterprise-grade
        </p>
      </div>
    </body></html>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = MAIL_FROM
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(MAIL_HOST, MAIL_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(MAIL_USER, MAIL_PASS)
            server.sendmail(MAIL_FROM, [to_email], msg.as_string())
        return True
    except Exception as exc:
        print(f"[EMAIL ERROR] Failed to send OTP to {to_email}: {exc}")
        return False


# ─── DB helpers ───────────────────────────────────────────────────────────────

async def get_user_by_email(email: str, db: aiosqlite.Connection):
    async with db.execute(
        "SELECT * FROM users WHERE email = ?", (email.lower().strip(),)
    ) as cur:
        return await cur.fetchone()


async def get_user_by_id(user_id: int, db: aiosqlite.Connection):
    async with db.execute(
        "SELECT * FROM users WHERE id = ?", (user_id,)
    ) as cur:
        return await cur.fetchone()


async def get_active_tenant_for_user(user_id: int, db: aiosqlite.Connection):
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


async def get_pending_otp(user_id: int, db: aiosqlite.Connection):
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

