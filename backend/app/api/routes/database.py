"""FastAPI routes for Multi-Database Connection (PostgreSQL, MySQL, MSSQL, Azure SQL),
Schema Management, Data Migration, and SQL Script Export.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Body, HTTPException, Query, Response
from pydantic import BaseModel

from app.core.logging_config import get_logger
from app.services.database_service import db_service

logger = get_logger(__name__)
router = APIRouter()


class DatabaseConnectionPayload(BaseModel):
    engine: Optional[str] = "postgresql"
    connection_url: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    database: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    ssl_mode: Optional[str] = "prefer"


def construct_url_by_engine(payload: DatabaseConnectionPayload) -> str:
    if payload.connection_url and payload.connection_url.strip():
        return payload.connection_url.strip()

    engine = (payload.engine or "postgresql").lower()
    host = payload.host.strip() if payload.host else "localhost"
    db = payload.database.strip() if payload.database else "zensustech"
    password = payload.password or ""

    if engine in ("mysql", "mariadb"):
        port = payload.port or 3306
        user = payload.username.strip() if payload.username else "root"
        auth = f"{user}:{password}@" if password else f"{user}@"
        return f"mysql://{auth}{host}:{port}/{db}"

    elif engine in ("mssql", "sqlserver", "azure_sql"):
        port = payload.port or 1433
        user = payload.username.strip() if payload.username else "sa"
        auth = f"{user}:{password}@" if password else f"{user}@"
        return f"mssql://{auth}{host}:{port}/{db}"

    else:
        port = payload.port or 5432
        user = payload.username.strip() if payload.username else "postgres"
        auth = f"{user}:{password}@" if password else f"{user}@"
        ssl_param = f"?sslmode={payload.ssl_mode}" if payload.ssl_mode else ""
        return f"postgresql://{auth}{host}:{port}/{db}{ssl_param}"


@router.get("/status", summary="Get active database connection status and table stats")
async def get_database_status():
    try:
        return db_service.get_status()
    except Exception as e:
        logger.error(f"Error checking database status: {e}")
        return {"connected": False, "error": str(e)}


@router.post("/test", summary="Test connection to PostgreSQL, MySQL, MSSQL, or Azure SQL")
async def test_database_connection(payload: DatabaseConnectionPayload = Body(...)):
    url = construct_url_by_engine(payload)
    result = db_service.test_connection(
        engine=payload.engine or "postgresql",
        url=url,
        host=payload.host,
        port=payload.port,
        database=payload.database,
        username=payload.username,
        password=payload.password,
        ssl_mode=payload.ssl_mode,
    )
    return result


@router.post("/connect", summary="Connect and save database configuration")
async def connect_database(payload: DatabaseConnectionPayload = Body(...)):
    url = construct_url_by_engine(payload)
    config_dict = payload.model_dump()
    config_dict["connection_url"] = url
    result = db_service.connect(config_dict)
    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("error") or "Failed to connect to database",
        )
    return {
        "message": f"Successfully connected to {payload.engine.upper() if payload.engine else 'PostgreSQL'} database",
        **result,
    }


@router.post("/disconnect", summary="Disconnect active database")
async def disconnect_database():
    return db_service.disconnect()


@router.post("/init-schema", summary="Initialize database schema tables")
async def init_schema(payload: Optional[Dict[str, Any]] = Body(default=None)):
    engine = payload.get("engine", "postgresql") if payload else "postgresql"
    result = db_service.init_schema(engine=engine)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error") or "Schema initialization failed")
    return result


@router.post("/migrate-data", summary="Move & sync data from JSON stores into connected database")
async def migrate_data(payload: Optional[Dict[str, Any]] = Body(default=None)):
    extra_customers = payload.get("customers") if payload else None
    result = db_service.migrate_data(extra_customers=extra_customers)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error") or "Data migration failed")
    return result


@router.get("/export-sql", summary="Export migration SQL script for MySQL, MSSQL, or PostgreSQL")
async def export_sql_script(engine: str = Query("mysql")):
    script = db_service.generate_sql_dump(target_engine=engine)
    return Response(
        content=script,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=zensustech_{engine}_migration.sql"},
    )


@router.get("/tables/{table_name}", summary="Preview records in a database table")
async def get_table_records(table_name: str, limit: int = Query(50, ge=1, le=500)):
    result = db_service.get_table_preview(table_name=table_name, limit=limit)
    if "error" in result and result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result
