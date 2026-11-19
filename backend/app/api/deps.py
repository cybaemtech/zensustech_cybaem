from typing import Optional
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

async def _get_live_session_graph_token() -> Optional[str]:
    """Helper to auto-resolve a valid Microsoft Graph token from the database sessions."""
    try:
        from app.db.database import get_pg_url
        import psycopg
        from psycopg.rows import dict_row
        from app.services.azure.auth_service import AzureAuthService

        url = get_pg_url()
        with psycopg.connect(url, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT tenant_id, client_id, client_secret, graph_token FROM sessions WHERE tenant_id IS NOT NULL AND client_secret IS NOT NULL ORDER BY updated_at DESC LIMIT 1"
                )
                row = cur.fetchone()
                if not row:
                    return None
                tid = row.get("tenant_id")
                cid = row.get("client_id")
                sec = row.get("client_secret")
                stored = row.get("graph_token")

                if stored:
                    try:
                        async with httpx.AsyncClient(timeout=3.0) as client:
                            r = await client.get("https://graph.microsoft.com/v1.0/organization", headers={"Authorization": f"Bearer {stored}"})
                            if r.status_code == 200:
                                return stored
                    except Exception:
                        pass

                if tid and cid and sec:
                    new_token = await AzureAuthService.get_access_token(
                        tenant_id=tid, client_id=cid, client_secret=sec, scope="https://graph.microsoft.com/.default"
                    )
                    if new_token:
                        cur.execute("UPDATE sessions SET graph_token = %s, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = %s", (new_token, tid))
                        conn.commit()
                        return new_token
    except Exception as e:
        logger.warning(f"Could not auto-resolve Graph token from session: {e}")
    return None

async def get_mgmt_token(request: Request, auth: Optional[HTTPAuthorizationCredentials] = Security(security)) -> str:
    if auth and auth.credentials:
        return auth.credentials
    auth_hdr = request.headers.get("Authorization", "")
    if auth_hdr.startswith("Bearer "):
        return auth_hdr[7:]
    mgmt_hdr = request.headers.get("X-Management-Token") or request.headers.get("X-Mgmt-Token")
    if mgmt_hdr and mgmt_hdr not in ("null", "undefined", ""):
        return mgmt_hdr
    raise HTTPException(status_code=401, detail="Missing Authorization Header")

async def get_graph_token(request: Request) -> str:
    token = request.headers.get("X-Graph-Token")
    if not token or token in ("null", "undefined", ""):
        auth_hdr = request.headers.get("Authorization", "")
        if auth_hdr.startswith("Bearer "):
            token = auth_hdr[7:]
    if not token or token in ("null", "undefined", ""):
        token = await _get_live_session_graph_token()
    if not token or token in ("null", "undefined", ""):
        raise HTTPException(status_code=401, detail="Missing X-Graph-Token Header and no active Azure session found")
    return token

async def get_optional_graph_token(request: Request) -> Optional[str]:
    token = request.headers.get("X-Graph-Token")
    if not token or token in ("null", "undefined", ""):
        auth_hdr = request.headers.get("Authorization", "")
        if auth_hdr.startswith("Bearer "):
            token = auth_hdr[7:]
    if not token or token in ("null", "undefined", ""):
        token = await _get_live_session_graph_token()
    return token