"""
Auth service: OTP generation, hashing, email sending, user lookups.
"""
import secrets
import hashlib
import smtplib
import os
import logging
from pathlib import Path
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import aiosqlite
import bcrypt

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


# ─── Email ────────────────────────────────────────────────────────────────────

def get_smtp_config():
    # Reload .env if present
    try:
        from dotenv import load_dotenv
        for p in [Path(".env"), Path("backend/.env"), Path(__file__).resolve().parents[3] / ".env"]:
            if p.is_file():
                load_dotenv(p, override=True)
                break
    except Exception:
        pass

    host = os.getenv("SMTP_HOST") or os.getenv("MAIL_HOST") or "smtp.gmail.com"
    port = int(os.getenv("SMTP_PORT") or os.getenv("MAIL_PORT") or "587")
    user = os.getenv("SMTP_USER") or os.getenv("MAIL_USER") or ""
    password = (
        os.getenv("SMTP_PASS")
        or os.getenv("SMTP_PASSWORD")
        or os.getenv("MAIL_PASS")
        or os.getenv("MAIL_PASSWORD")
        or ""
    )
    sender = (
        os.getenv("SMTP_FROM")
        or os.getenv("MAIL_FROM")
        or "Zensus <noreply@zensus.com>"
    )
    is_configured = bool(user and password)
    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "sender": sender,
        "is_configured": is_configured,
    }


def is_live_email_configured() -> bool:
    return get_smtp_config()["is_configured"]


def send_otp_email(to_email: str, otp: str, full_name: str = "User") -> bool:
    """
    Send the OTP verification email strictly via SMTP.
    Sender defaults to noreply@zensus.com.
    """
    cfg = get_smtp_config()
    if not cfg["is_configured"]:
        print(
            f"[EMAIL CONFIG NOTICE] Cannot deliver email to {to_email}: "
            f"SMTP_USER or SMTP_PASS is missing in your .env file. "
            f"To send live emails from {cfg['sender']}, please provide SMTP credentials in .env or Render environment variables."
        )
        return False

    subject = "Zensus - Email Verification Code"
    html_body = f"""
    <html><body style="font-family:Inter,Segoe UI,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;">
      <div style="max-width:520px;margin:20px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Zensus Verification Code</h2>
          <p style="color:#64748b;margin:0;font-size:13px;">Enterprise Cloud Operations & Identity Management</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;font-size:15px;line-height:1.5;">
          Hello <strong>{full_name}</strong>,
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
          © Zensus Team · Sent from {cfg['sender']}
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
Sent from {cfg['sender']}
"""

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = cfg["sender"]
        msg["To"] = to_email
        msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        if cfg["port"] == 465:
            with smtplib.SMTP_SSL(cfg["host"], cfg["port"], timeout=10) as server:
                server.login(cfg["user"], cfg["password"])
                server.sendmail(cfg["sender"], [to_email], msg.as_string())
        else:
            with smtplib.SMTP(cfg["host"], cfg["port"], timeout=10) as server:
                server.ehlo()
                server.starttls()
                server.login(cfg["user"], cfg["password"])
                server.sendmail(cfg["sender"], [to_email], msg.as_string())

        print(f"[EMAIL SENT] Successfully dispatched OTP email from {cfg['sender']} to {to_email}")
        return True
    except Exception as exc:
        print(f"[EMAIL ERROR] Failed to send OTP email from {cfg['sender']} to {to_email}: {exc}")
        return False


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

