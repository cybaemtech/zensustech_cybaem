"""Runtime configuration for the local ZensusTech API."""

import os
import secrets


class Settings:
    """Small environment-backed settings object used by the API services."""

    GRAPH_BASE = os.getenv("GRAPH_BASE", "https://graph.microsoft.com/v1.0")
    BETA_BASE = os.getenv("BETA_BASE", "https://graph.microsoft.com/beta")
    ARM_BASE = os.getenv("ARM_BASE", "https://management.azure.com")
    API_V1_STR = os.getenv("API_V1_STR", "/api/v1")
    PROJECT_NAME = os.getenv("PROJECT_NAME", "ZensusTech Platform API")
    ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
    SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY") or secrets.token_urlsafe(32)
    SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_urlsafe(32)
    SENTRY_DSN = os.getenv("SENTRY_DSN")
    FRONTEND_HOST = os.getenv("FRONTEND_HOST", "http://localhost:5173")
    BACKEND_CORS_ORIGINS = tuple(
        origin.strip().rstrip("/")
        for origin in os.getenv("BACKEND_CORS_ORIGINS", "").split(",")
        if origin.strip()
    )
    AZURE_ROLES = {
        "8e3af657-a8ff-443c-a75c-2fe8c4bcb635": "Owner",
        "b24988ac-6180-42a0-ab88-20f7382dd24c": "Contributor",
        "acdd72a7-3385-48ef-bd42-f606fba81ae7": "Reader",
        "18d7d88d-d35e-4fb5-a5c3-7773c20a72d9": "User Access Administrator",
    }

    @property
    def all_cors_origins(self) -> list[str]:
        return [*self.BACKEND_CORS_ORIGINS, self.FRONTEND_HOST.rstrip("/")]


settings = Settings()
