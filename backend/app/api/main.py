"""
Main API router configuration.
"""
from fastapi import APIRouter
from app.api.routes import azure, governance, microsoft365, database
from app.api.routes.auth import router as auth_router
from app.api.routes.tenants import router as tenants_router

api_router = APIRouter()

# Auth & Tenant management (new)
api_router.include_router(auth_router)
api_router.include_router(tenants_router)

# Existing Azure / M365 / Governance / DB routes
api_router.include_router(azure.router)
api_router.include_router(governance.router)
api_router.include_router(microsoft365.router, prefix="/microsoft0365")
api_router.include_router(database.router, prefix="/database", tags=["08 · Database"])
