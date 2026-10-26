"""
Main API router configuration.
"""
from fastapi import APIRouter
from app.api.routes import azure, governance, microsoft365, database

api_router = APIRouter()

api_router.include_router(azure.router)
api_router.include_router(governance.router)
api_router.include_router(microsoft365.router, prefix="/microsoft0365")
api_router.include_router(database.router, prefix="/database", tags=["08 · Database"])
