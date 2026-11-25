"""
Microsoft 365 API routes for license management and identity governance.
Supports all 22+ checks described in '365 Managed Services offering_v02.txt'
with data permanently stored and synchronized into PostgreSQL.
"""
import os
import psycopg
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends

from app.api.models.responses import LicenseUsageResponse, GovernanceItem
from app.core.exceptions import AzureAPIError, TokenError
from app.core.logging_config import get_logger
from app.api.deps import get_graph_token
from app.services.azure.license_service import LicenseService
from app.services.azure.m365_sync_service import M365SyncService

logger = get_logger(__name__)

router = APIRouter()

DB_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:root@localhost:5432/zensustech")


@router.get("/license_and_usage_details", response_model=LicenseUsageResponse, tags=["05 · Microsoft 365"], summary="Get license and usage details")
async def get_license_and_usage_details(
    graph_token: str = Depends(get_graph_token)
) -> LicenseUsageResponse:
    """
    Get Microsoft 365 license usage details using header tokens.
    """
    try:
        license_service = LicenseService(graph_token=graph_token)
        result = await license_service.get_license_usage_details()
        return LicenseUsageResponse(**result)
    except (TokenError, AzureAPIError) as e:
        logger.error(f"Azure API Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching license usage: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch license usage details")


@router.get("/identity/governance", response_model=list[GovernanceItem], tags=["05 · Microsoft 365"], summary="List identity governance reviews")
async def get_identity_report(
    graph_token: str = Depends(get_graph_token)
) -> list[GovernanceItem]:
    """
    Get identity governance report via GET with header tokens.
    """
    try:
        license_service = LicenseService(graph_token=graph_token)
        report_data = await license_service.get_identity_governance_report()
        logger.info(f"Identity governance report generated with {len(report_data)} items")
        return [GovernanceItem(**item) for item in report_data]
    except (TokenError, AzureAPIError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching identity governance: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch identity governance report")


@router.get("/secure/score", tags=["05 · Microsoft 365"], summary="Get Microsoft Secure Score")
async def get_microsoft0365_secure_score_details(
    graph_token: str = Depends(get_graph_token)
):
    """
    Get M365 Secure Score details via GET with header tokens.
    """
    try:
        license_service = LicenseService(graph_token=graph_token)
        report_data = await license_service.get_microsoft0365_secure_score()
        return report_data
    except (TokenError, AzureAPIError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching secure score: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch secure score details")


@router.get("/checks", tags=["05 · Microsoft 365"], summary="Get 22 ZenAIOps M365 Managed Checks from Database")
async def get_m365_checks(
    tenant_id: str = "9414ece9-9039-40b7-a6a7-7ecbe7409245"
):
    """
    Returns all 22+ ZenAIOps M365 Managed Services checks stored in PostgreSQL database.
    If database checks are empty, runs live sync against Azure Graph API first.
    """
    try:
        checks_list = []
        with psycopg.connect(DB_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT check_number, check_id, category, check_name, api_endpoint, 
                           status, metric_value, summary, recommendation, details_json, updated_at
                    FROM m365_managed_checks
                    WHERE tenant_id=%s
                    ORDER BY check_number ASC;
                """, (tenant_id,))
                rows = cur.fetchall()
                for r in rows:
                    checks_list.append({
                        "num": r[0],
                        "id": r[1],
                        "category": r[2],
                        "label": r[3],
                        "api": r[4],
                        "status": r[5],
                        "value": r[6],
                        "detail": r[7],
                        "recommendation": r[8],
                        "details": r[9],
                        "updated_at": r[10].isoformat() if hasattr(r[10], "isoformat") else str(r[10] or "")
                    })

        if not checks_list:
            sync_service = M365SyncService(tenant_id=tenant_id)
            await sync_service.sync_all()
            return await get_m365_checks(tenant_id=tenant_id)

        return {
            "success": True,
            "tenant_id": tenant_id,
            "total_checks": len(checks_list),
            "checks": checks_list
        }
    except Exception as e:
        logger.error(f"Error fetching M365 checks: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch M365 checks: {str(e)}")


@router.get("/executive_report", tags=["05 · Microsoft 365"], summary="Get Executive Report Scorecard from Database")
async def get_m365_executive_report(
    tenant_id: str = "9414ece9-9039-40b7-a6a7-7ecbe7409245"
):
    """
    Returns the comprehensive M365 Executive Report scorecard stored in PostgreSQL.
    """
    try:
        report = None
        with psycopg.connect(DB_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT overall_score, health_grade, total_licenses_purchased, total_licenses_assigned,
                           total_licenses_available, license_utilization_pct, potential_monthly_savings, potential_annual_savings,
                           total_users_count, active_users_count, inactive_users_15d_count, inactive_users_30d_count,
                           guest_users_count, disabled_users_count, admins_count, mfa_enabled_count, mfa_disabled_count,
                           mfa_coverage_pct, devices_count, compliant_devices_count, service_health_status,
                           findings_json, recommendations_json, updated_at
                    FROM m365_executive_reports
                    WHERE tenant_id=%s
                    ORDER BY updated_at DESC LIMIT 1;
                """, (tenant_id,))
                row = cur.fetchone()
                if row:
                    report = {
                        "overall_score": row[0],
                        "health_grade": row[1],
                        "total_licenses_purchased": row[2],
                        "total_licenses_assigned": row[3],
                        "total_licenses_available": row[4],
                        "license_utilization_pct": row[5],
                        "potential_monthly_savings": float(row[6] or 0),
                        "potential_annual_savings": float(row[7] or 0),
                        "total_users_count": row[8],
                        "active_users_count": row[9],
                        "inactive_users_15d_count": row[10],
                        "inactive_users_30d_count": row[11],
                        "guest_users_count": row[12],
                        "disabled_users_count": row[13],
                        "admins_count": row[14],
                        "mfa_enabled_count": row[15],
                        "mfa_disabled_count": row[16],
                        "mfa_coverage_pct": row[17],
                        "devices_count": row[18],
                        "compliant_devices_count": row[19],
                        "service_health_status": row[20],
                        "findings": row[21],
                        "recommendations": row[22],
                        "updated_at": row[23].isoformat() if hasattr(row[23], "isoformat") else str(row[23] or "")
                    }

        if not report:
            sync_service = M365SyncService(tenant_id=tenant_id)
            await sync_service.sync_all()
            return await get_m365_executive_report(tenant_id=tenant_id)

        return {
            "success": True,
            "tenant_id": tenant_id,
            "report": report
        }
    except Exception as e:
        logger.error(f"Error fetching executive report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch executive report: {str(e)}")


@router.post("/sync", tags=["05 · Microsoft 365"], summary="Sync live M365 data from Azure Graph to Database")
@router.get("/sync", tags=["05 · Microsoft 365"], summary="Sync live M365 data from Azure Graph to Database")
async def sync_m365_live_data(
    tenant_id: str = "9414ece9-9039-40b7-a6a7-7ecbe7409245"
):
    """
    Forces live synchronization of all Microsoft Graph tenant data directly into PostgreSQL.
    """
    try:
        sync_service = M365SyncService(tenant_id=tenant_id)
        result = await sync_service.sync_all()
        return result
    except Exception as e:
        logger.error(f"Error syncing M365 live data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


@router.get("/licenses", tags=["05 · Microsoft 365"], summary="List all subscribed licenses from Database")
async def get_db_licenses(
    tenant_id: str = "9414ece9-9039-40b7-a6a7-7ecbe7409245"
):
    """
    Returns all subscribed licenses for tenant categorized by license family from PostgreSQL.
    """
    try:
        items = []
        with psycopg.connect(DB_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT sku_id, sku_name, sku_part_number, license_family, 
                           consumed_units, prepaid_units, available_units, status, expiration_date
                    FROM m365_licenses
                    WHERE tenant_id=%s
                    ORDER BY consumed_units DESC;
                """, (tenant_id,))
                for r in cur.fetchall():
                    items.append({
                        "skuId": r[0],
                        "productName": r[1],
                        "skuPartNumber": r[2],
                        "family": r[3] or "Other",
                        "consumed": r[4],
                        "purchased": r[5],
                        "available": r[6],
                        "status": r[7],
                        "expirationDate": r[8].isoformat() if hasattr(r[8], "isoformat") else str(r[8] or "")
                    })
        return {"success": True, "tenant_id": tenant_id, "licenses": items}
    except Exception as e:
        logger.error(f"Error fetching DB licenses: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
