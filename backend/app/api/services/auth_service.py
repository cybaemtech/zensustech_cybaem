"""
Auth service: OTP generation, hashing, database storage of authentication emails,
and real email dispatch via Cybaem SMTP (webmail.cybaemtech.com) & Azure Graph.
"""
import asyncio
import secrets
import hashlib
import os
import smtplib
import logging
import html
from urllib.parse import quote
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Dict
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path

import bcrypt
import httpx

# Load local .env if available
try:
    from dotenv import load_dotenv
    for p in [Path(".env"), Path("backend/.env"), Path(__file__).resolve().parents[3] / ".env"]:
        if p.is_file():
            load_dotenv(p, override=True)
            break
except Exception:
    pass

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


def generate_random_password(length: int = 10) -> str:
    """Generate a clean, secure random password with letters, digits, and a special character."""
    import string
    chars = string.ascii_letters + string.digits + "@#$!*"
    while True:
        pwd = ''.join(secrets.choice(chars) for _ in range(length))
        if (any(c.islower() for c in pwd)
            and any(c.isupper() for c in pwd)
            and any(c.isdigit() for c in pwd)
            and any(c in "@#$!*" for c in pwd)):
            return pwd


# ─── OTP helpers ─────────────────────────────────────────────────────────────

def generate_otp() -> str:
    """Return a secure 6-digit OTP string."""
    return str(secrets.randbelow(900000) + 100000)


def hash_otp(otp: str) -> str:
    """SHA-256 hash of the OTP for secure storage."""
    return hashlib.sha256(otp.encode()).hexdigest()


def verify_otp_hash(otp: str, otp_hash: str) -> bool:
    return hash_otp(otp) == otp_hash


# ─── Session token ────────────────────────────────────────────────────────────

def create_session_token() -> str:
    return secrets.token_urlsafe(48)


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


# ─── Email Content & Dispatch ────────────────────────────────────────────────

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


def build_forgot_password_email_content(new_password: str, full_name: str, sender: str = "noreply@cybaemtech.com") -> tuple[str, str]:
    safe_name = html.escape(full_name)
    safe_password = html.escape(new_password)
    html_body = f"""
    <html><body style="font-family:Inter,Segoe UI,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;">
      <div style="max-width:520px;margin:20px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Zensus Password Reset</h2>
          <p style="color:#64748b;margin:0;font-size:13px;">Enterprise Cloud Operations & Identity Management</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;font-size:15px;line-height:1.5;">
          Hello <strong>{safe_name}</strong>,
        </p>
        <p style="color:#475569;margin:0 0 20px;font-size:14px;line-height:1.6;">
          You requested a password reset for your ZensusTech account. A new random password has been generated for you:
        </p>
        <div style="text-align:center;margin:24px 0;">
          <div style="display:inline-block;font-size:28px;font-weight:800;letter-spacing:3px;color:#008cff;background:#eff6ff;padding:14px 24px;border-radius:10px;border:2px dashed #93c5fd;font-family:Consolas,monospace;">
            {safe_password}
          </div>
        </div>
        <p style="color:#475569;font-size:13px;margin:0 0 12px;text-align:center;">
          🔑 Use this new temporary password to sign in at <a href="http://localhost:3000" style="color:#008cff;font-weight:600;text-decoration:none;">ZensusTech Cloud</a>.
        </p>
        <p style="color:#64748b;font-size:12px;margin:0 0 10px;text-align:center;">
          For your account security, you can change your password at any time once logged in.
        </p>
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          If you did not request this password reset, please contact your administrator immediately.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 18px;">
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          ZensusTech Security Team · Sent from {sender}
        </p>
      </div>
    </body></html>
    """

    plain_body = f"""Hello {full_name},

You requested a password reset for your ZensusTech account.
Your new temporary password is: {new_password}

Use this password to sign in to ZensusTech.
For your security, you can change your password once you are logged in.

If you did not request this password reset, please contact your administrator immediately.

Regards,
Zensus Team
Sent from {sender}
"""
    return html_body, plain_body


def _send_smtp_sync(
    to_email: str,
    subject: str,
    html_body: str,
    plain_body: str,
    sender_email: str,
    smtp_host: str,
    smtp_port: int,
    smtp_user: str,
    smtp_pass: str,
) -> bool:
    """Synchronous SMTP mail delivery."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"ZensusTech <{sender_email}>"
        msg["To"] = to_email
        msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12) as server:
                server.login(smtp_user, smtp_pass)
                server.sendmail(sender_email, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=12) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(smtp_user, smtp_pass)
                server.sendmail(sender_email, [to_email], msg.as_string())

        logger.info(f"Successfully delivered email via SMTP ({smtp_host}) to {to_email}")
        return True
    except Exception as exc:
        logger.warning(f"SMTP delivery failed to {to_email} via {smtp_host}:{smtp_port}: {exc}")
        return False


async def record_and_send_auth_email(
    user_id: Optional[int],
    to_email: str,
    otp: str,
    full_name: str,
    db: Any,
) -> Dict[str, Any]:
    """
    1. Formats email from noreply@cybaemtech.com.
    2. Sends email using configured credentials (webmail.cybaemtech.com / Azure Graph).
    3. Stores email and delivery status in PostgreSQL/database auth_emails table for 100% certainty.
    """
    sender_email = (
        os.getenv("SMTP_USER")
        or os.getenv("AZURE_SENDER_EMAIL")
        or os.getenv("GRAPH_MAIL_SENDER")
        or "noreply@cybaemtech.com"
    ).strip()
    smtp_host = os.getenv("SMTP_HOST", "webmail.cybaemtech.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_pass = (os.getenv("SMTP_PASS") or os.getenv("SMTP_PASSWORD") or "Cybaem@26#").strip()

    subject = "Zensus - Email Verification Code"
    html_body, plain_body = build_auth_email_content(otp, full_name, sender_email)
    delivery_status = "stored_in_db"
    delivery_method = "database"

    # 1. Attempt real SMTP delivery via webmail.cybaemtech.com
    if sender_email and smtp_pass:
        try:
            delivered = await asyncio.to_thread(
                _send_smtp_sync,
                to_email,
                subject,
                html_body,
                plain_body,
                sender_email,
                smtp_host,
                smtp_port,
                sender_email,
                smtp_pass,
            )
            if delivered:
                delivery_status = "sent_via_smtp"
                delivery_method = "smtp"
        except Exception as e:
            logger.warning(f"Async SMTP dispatch error: {e}")

    # 2. If SMTP was not used or failed, check Azure Graph credentials if configured
    if delivery_status == "stored_in_db":
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
                                f"https://graph.microsoft.com/v1.0/users/{quote(sender_email, safe='')}/sendMail",
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
                                delivery_method = "azure_graph"
                                logger.info(f"Dispatched email via Azure Graph to {to_email}")
            except Exception as e:
                logger.warning(f"Azure Graph dispatch exception: {e}")

    # 3. Always store in database auth_emails table for 100% persistence
    await db.execute(
        """
        INSERT INTO auth_emails (
            user_id, recipient_email, sender_email, subject, otp_code, html_body, plain_body, delivery_method, delivery_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            to_email.lower().strip(),
            sender_email,
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
        "from": sender_email,
        "subject": subject,
        "otp": otp,
        "html": html_body,
        "text": plain_body,
        "delivery_status": delivery_status,
        "delivery_method": delivery_method,
    }


async def send_random_password_email(
    user_id: Optional[int],
    to_email: str,
    new_password: str,
    full_name: str,
    db: Any,
) -> Dict[str, Any]:
    """
    Dispatches the generated random password to user's email via SMTP/Graph
    and stores record in the auth_emails table in PostgreSQL.
    """
    sender_email = (
        os.getenv("SMTP_USER")
        or os.getenv("AZURE_SENDER_EMAIL")
        or os.getenv("GRAPH_MAIL_SENDER")
        or "noreply@cybaemtech.com"
    ).strip()
    smtp_host = os.getenv("SMTP_HOST", "webmail.cybaemtech.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_pass = (os.getenv("SMTP_PASS") or os.getenv("SMTP_PASSWORD") or "Cybaem@26#").strip()

    subject = "Zensus - Your New Temporary Password"
    html_body, plain_body = build_forgot_password_email_content(new_password, full_name, sender_email)
    delivery_status = "stored_in_db"
    delivery_method = "database"

    # 1. Dispatch via webmail.cybaemtech.com
    if sender_email and smtp_pass:
        try:
            delivered = await asyncio.to_thread(
                _send_smtp_sync,
                to_email,
                subject,
                html_body,
                plain_body,
                sender_email,
                smtp_host,
                smtp_port,
                sender_email,
                smtp_pass,
            )
            if delivered:
                delivery_status = "sent_via_smtp"
                delivery_method = "smtp"
        except Exception as e:
            logger.warning(f"Forgot password SMTP dispatch error: {e}")

    # 2. Azure Graph API fallback
    if delivery_status == "stored_in_db":
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
                                f"https://graph.microsoft.com/v1.0/users/{quote(sender_email, safe='')}/sendMail",
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
                                delivery_method = "azure_graph"
                                logger.info(f"Dispatched password reset via Azure Graph to {to_email}")
            except Exception as e:
                logger.warning(f"Azure Graph dispatch exception: {e}")

    # 3. Always store in database auth_emails table
    await db.execute(
        """
        INSERT INTO auth_emails (
            user_id, recipient_email, sender_email, subject, otp_code, html_body, plain_body, delivery_method, delivery_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            to_email.lower().strip(),
            sender_email,
            subject,
            new_password,
            html_body,
            plain_body,
            delivery_method,
            delivery_status,
        ),
    )
    await db.commit()

    return {
        "to": to_email,
        "from": sender_email,
        "subject": subject,
        "new_password": new_password,
        "html": html_body,
        "text": plain_body,
        "delivery_status": delivery_status,
        "delivery_method": delivery_method,
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
