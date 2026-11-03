from typing import Optional
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)

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
        raise HTTPException(status_code=401, detail="Missing X-Graph-Token Header")
    return token

async def get_optional_graph_token(request: Request) -> Optional[str]:
    token = request.headers.get("X-Graph-Token")
    if not token or token in ("null", "undefined", ""):
        auth_hdr = request.headers.get("Authorization", "")
        if auth_hdr.startswith("Bearer "):
            token = auth_hdr[7:]
    if not token or token in ("null", "undefined", ""):
        return None
    return token