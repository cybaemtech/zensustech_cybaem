"""
Tenant connection and management routes.
"""
from __future__ import annotations

from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.db.database import get_db
from app.api.routes.auth import _get_session_user, _now_utc
from app.api.services.auth_service import get_active_tenant_for_user

router = APIRouter(prefix="/tenants", tags=["00b · Tenant Management"])


class TenantConnectRequest(BaseModel):
    tenant_id: str
    tenant_name: Optional[str] = None
    provider_type: str          # cloud | office365
    provider_name: Optional[str] = None   # azure | gcp | aws | native_cloud
    subscription_plan: str = "Trial"      # Trial | Bronze | Silver | Gold


@router.post("/connect")
async def connect_tenant(
    payload: TenantConnectRequest,
    request: Request,
    db: Any = Depends(get_db),
):
    user_id = await _get_session_user(request, db)

    provider_type = payload.provider_type.lower()
    provider_name = (payload.provider_name or "").lower()

    # Upsert tenant record
    async with db.execute(
        """
        SELECT id FROM tenants
        WHERE tenant_id = ? AND provider_type = ?
        """,
        (payload.tenant_id, provider_type),
    ) as cur:
        existing_tenant = await cur.fetchone()

    now = _now_utc()

    if existing_tenant:
        tenant_db_id = existing_tenant["id"]
        await db.execute(
            """
            UPDATE tenants
            SET tenant_name=?, provider_name=?, subscription_plan=?,
                connection_status='active', updated_at=?
            WHERE id=?
            """,
            (payload.tenant_name, provider_name, payload.subscription_plan, now, tenant_db_id),
        )
    else:
        await db.execute(
            """
            INSERT INTO tenants
                (tenant_id, tenant_name, provider_type, provider_name, subscription_plan, connection_status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
            """,
            (
                payload.tenant_id,
                payload.tenant_name,
                provider_type,
                provider_name,
                payload.subscription_plan,
                now,
                now,
            ),
        )
        await db.commit()
        async with db.execute(
            "SELECT id FROM tenants WHERE tenant_id = ? AND provider_type = ?",
            (payload.tenant_id, provider_type),
        ) as cur:
            new_t = await cur.fetchone()
        tenant_db_id = new_t["id"]

    await db.commit()

    # Link user ↔ tenant (upsert)
    async with db.execute(
        "SELECT id FROM user_tenants WHERE user_id = ? AND tenant_id = ?",
        (user_id, tenant_db_id),
    ) as cur:
        link = await cur.fetchone()

    if not link:
        await db.execute(
            "INSERT INTO user_tenants (user_id, tenant_id, is_primary) VALUES (?, ?, TRUE)",
            (user_id, tenant_db_id),
        )
        await db.commit()

    # Insert subscription record
    await db.execute(
        """
        INSERT INTO subscriptions (tenant_id, plan_name, provider_type)
        VALUES (?, ?, ?)
        """,
        (tenant_db_id, payload.subscription_plan, provider_type),
    )
    await db.commit()

    return {
        "message": "Tenant connected successfully.",
        "tenant_db_id": tenant_db_id,
        "redirect": "/dashboard",
    }


@router.get("/my-tenants")
async def my_tenants(request: Request, db: Any = Depends(get_db)):
    user_id = await _get_session_user(request, db)
    async with db.execute(
        """
        SELECT t.* FROM tenants t
        JOIN user_tenants ut ON ut.tenant_id = t.id
        WHERE ut.user_id = ?
        ORDER BY ut.is_primary DESC, t.created_at DESC
        """,
        (user_id,),
    ) as cur:
        rows = await cur.fetchall()
    return {"tenants": [dict(r) for r in rows]}


@router.get("/{tenant_db_id}")
async def get_tenant(
    tenant_db_id: int,
    request: Request,
    db: Any = Depends(get_db),
):
    user_id = await _get_session_user(request, db)
    async with db.execute(
        """
        SELECT t.* FROM tenants t
        JOIN user_tenants ut ON ut.tenant_id = t.id
        WHERE t.id = ? AND ut.user_id = ?
        """,
        (tenant_db_id, user_id),
    ) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Tenant not found.")
    return dict(row)


@router.put("/{tenant_db_id}")
async def update_tenant(
    tenant_db_id: int,
    payload: TenantConnectRequest,
    request: Request,
    db: Any = Depends(get_db),
):
    user_id = await _get_session_user(request, db)
    # Verify ownership
    async with db.execute(
        "SELECT id FROM user_tenants WHERE user_id = ? AND tenant_id = ?",
        (user_id, tenant_db_id),
    ) as cur:
        link = await cur.fetchone()
    if not link:
        raise HTTPException(status_code=403, detail="Not authorized.")

    await db.execute(
        """
        UPDATE tenants
        SET tenant_name=?, provider_type=?, provider_name=?,
            subscription_plan=?, updated_at=?
        WHERE id=?
        """,
        (
            payload.tenant_name,
            payload.provider_type.lower(),
            (payload.provider_name or "").lower(),
            payload.subscription_plan,
            _now_utc(),
            tenant_db_id,
        ),
    )
    await db.commit()
    return {"message": "Tenant updated."}


@router.post("/{tenant_db_id}/reconnect")
async def reconnect_tenant(
    tenant_db_id: int,
    request: Request,
    db: Any = Depends(get_db),
):
    user_id = await _get_session_user(request, db)
    async with db.execute(
        "SELECT id FROM user_tenants WHERE user_id = ? AND tenant_id = ?",
        (user_id, tenant_db_id),
    ) as cur:
        link = await cur.fetchone()
    if not link:
        raise HTTPException(status_code=403, detail="Not authorized.")

    await db.execute(
        "UPDATE tenants SET connection_status='active', updated_at=? WHERE id=?",
        (_now_utc(), tenant_db_id),
    )
    await db.commit()
    return {"message": "Tenant reconnected.", "redirect": "/dashboard"}

