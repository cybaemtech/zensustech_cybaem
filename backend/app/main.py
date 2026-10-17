"""FastAPI application entry point for the complete ZensusTech API."""

from fastapi import FastAPI
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse
from starlette.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.api.middleware.logging_middleware import LoggingMiddleware
from app.core.config import settings


API_TAGS = [
    {"name": "01 · Authentication", "description": "Connect an Azure tenant and obtain access tokens."},
    {"name": "02 · Subscriptions & Access", "description": "Azure subscriptions, metadata, and assigned users."},
    {"name": "03 · Tenant Directory", "description": "Tenant users, applications, organization, and audit events."},
    {"name": "04 · Security & Audit", "description": "Tenant and subscription security posture and audit reports."},
    {"name": "05 · Microsoft 365", "description": "License usage, identity governance, and Secure Score."},
    {"name": "06 · Governance Insights", "description": "Governance metrics, risk distribution, and user analysis."},
    {"name": "07 · Certificates", "description": "SSL certificate inventory and expiry information."},
]

DOCS_CSS = """
  body { margin: 0; background: #f4f7fb; }
  .swagger-ui { color: #172b4d; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  .swagger-ui .topbar { background: #102a43; padding: 10px 0; }
  .swagger-ui .topbar-wrapper { max-width: 1180px; margin: 0 auto; }
  .swagger-ui .topbar-wrapper .link { visibility: hidden; }
  .swagger-ui .topbar-wrapper::after { content: "ZENSUSTECH  /  API WORKSPACE"; visibility: visible; color: #fff; font-size: 13px; font-weight: 700; letter-spacing: .12em; }
  .swagger-ui .wrapper { max-width: 1180px; padding-left: 24px; padding-right: 24px; }
  .swagger-ui .information-container.wrapper { padding-top: 34px; }
  .swagger-ui .info .title { color: #102a43; font-size: 34px; font-weight: 750; letter-spacing: -.035em; }
  .swagger-ui .info .description p { color: #526579; font-size: 14px; line-height: 1.7; }
  .swagger-ui .scheme-container { margin: 22px 0; padding: 16px 20px; border: 1px solid #e1e8f0; border-radius: 12px; background: #fff; box-shadow: 0 4px 14px rgba(16,42,67,.04); }
  .swagger-ui .opblock-tag { margin: 22px 0 10px; padding: 14px 18px; border: 1px solid #e1e8f0; border-radius: 10px; background: #fff; color: #102a43; font-size: 16px; font-weight: 700; box-shadow: 0 2px 7px rgba(16,42,67,.035); }
  .swagger-ui .opblock-tag small { color: #62758a; font-size: 12px; font-weight: 400; }
  .swagger-ui .opblock { margin: 0 0 9px; border-radius: 9px; box-shadow: none; }
  .swagger-ui .opblock .opblock-summary { padding: 7px 12px; }
  .swagger-ui .opblock .opblock-summary-path { color: #193b5a; font-size: 13px; }
  .swagger-ui .opblock .opblock-summary-description { color: #526579; }
  .swagger-ui .opblock .opblock-summary { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
  .swagger-ui .opblock .opblock-summary-description { flex: 1 1 auto; }
  .swagger-ui .plan-access { display: inline-flex; align-items: center; gap: 9px; margin-left: auto; padding: 4px 9px; border: 1px solid #e1e8f0; border-radius: 7px; background: #fff; color: #526579; font-size: 11px; white-space: nowrap; }
  .swagger-ui .plan-access-label { color: #193b5a; font-weight: 700; }
  .swagger-ui .plan-option { display: inline-flex; align-items: center; gap: 3px; }
  .swagger-ui .plan-option input { margin: 0; accent-color: #08765f; }
  @media (max-width: 640px) { .swagger-ui .plan-access { width: 100%; margin: 4px 0 0; justify-content: flex-start; } }
  .swagger-ui .btn, .swagger-ui select { border-radius: 7px; }
  .swagger-ui .btn.authorize { border-color: #11836b; color: #08765f; }
  .swagger-ui .btn.execute { background: #08765f; border-color: #08765f; }
  .swagger-ui section.models { margin: 28px 0; border: 1px solid #e1e8f0; border-radius: 10px; background: #fff; }
  @media (max-width: 640px) { .swagger-ui .wrapper { padding-left: 14px; padding-right: 14px; } .swagger-ui .info .title { font-size: 27px; } }
"""

# Tiers are cumulative: endpoints included in Basic are also included in
# Standard and Premium. Keys are the HTTP method and the route suffix.
DOCS_PLAN_ACCESS = {
    "GET /subscriptions": 1,
    "GET /subscriptions/{subscription_id}/metadata": 1,
    "GET /users": 1,
    "GET /tenant/users": 1,
    "GET /tenant/organization": 1,
    "GET /license_and_usage_details": 1,
    "POST /connect": 1,
    "GET /tenant/applications": 2,
    "GET /tenant/audit-logs": 2,
    "GET /security/tenant-posture": 2,
    "GET /api/security/subs-posture": 2,
    "POST /governance/stats": 2,
    "POST /governance/risk-distribution": 2,
    "POST /governance/users": 2,
    "POST /governance/user-activity-trend": 2,
    "POST /governance/role-counts": 2,
    "POST /governance/inactivity-analysis": 2,
    "POST /governance/external-users": 2,
    "POST /governance/ssl-certificates": 3,
    "GET /secure/score": 3,
    "GET /identity/governance": 3,
    "GET /security-audit-report": 3,
}

DOCS_PLAN_SCRIPT = """
<script>
(() => {
  const access = PLAN_ACCESS;
  const plans = ['Basic', 'Standard', 'Premium'];
  const normalize = value => (value || '').replace(/\\/$/, '');
  const render = () => document.querySelectorAll('.swagger-ui .opblock').forEach(block => {
    const method = block.querySelector('.opblock-summary-method')?.textContent?.trim().toUpperCase();
    const path = normalize(block.querySelector('.opblock-summary-path')?.getAttribute('data-path') || block.querySelector('.opblock-summary-path')?.textContent?.trim());
    if (!method || !path || block.querySelector('.plan-access')) return;
    const match = Object.entries(access).sort((left, right) => right[0].length - left[0].length).find(([key]) => {
      const [allowedMethod, suffix] = key.split(' ', 2);
      return method === allowedMethod && (path === suffix || path.endsWith(suffix));
    });
    if (!match) return;
    const maxTier = match[1];
    const badge = document.createElement('span');
    badge.className = 'plan-access';
    badge.setAttribute('aria-label', 'Plans that include this API');
    badge.innerHTML = '<span class="plan-access-label">Plans</span>' + plans.map((plan, index) =>
      '<label class="plan-option"><input type="checkbox" disabled ' + (index < maxTier ? 'checked ' : '') + 'aria-label="' + plan + '"><span>' + plan + '</span></label>'
    ).join('');
    block.querySelector('.opblock-summary')?.appendChild(badge);
  });
  new MutationObserver(render).observe(document.documentElement, { childList: true, subtree: true });
  render();
})();
</script>
"""

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description=(
        "Complete ZensusTech Azure and Microsoft 365 API reference. "
        "Use the ordered sections to connect a tenant, inspect subscriptions and directory data, "
        "and review security and governance results."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=None,
    redoc_url=f"{settings.API_V1_STR}/redoc",
    openapi_tags=API_TAGS,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.all_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# The governance router defines its own /governance prefix. api.main includes it
# once, so its public paths stay aligned with the frontend's /api/v1/governance/* calls.
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, prefix="/backend-api" + settings.API_V1_STR)


@app.get(f"{settings.API_V1_STR}/docs", include_in_schema=False)
async def swagger_docs() -> HTMLResponse:
    response = get_swagger_ui_html(
        openapi_url=app.openapi_url or f"{settings.API_V1_STR}/openapi.json",
        title=f"{settings.PROJECT_NAME} · API Reference",
        swagger_ui_parameters={
            "deepLinking": True,
            "docExpansion": "list",
            "filter": True,
            "displayRequestDuration": True,
            "operationsSorter": "alpha",
            "defaultModelsExpandDepth": 1,
        },
    )
    import json

    plan_script = DOCS_PLAN_SCRIPT.replace("PLAN_ACCESS", json.dumps(DOCS_PLAN_ACCESS))
    html = response.body.decode("utf-8").replace(
        "</head>", f"<style>{DOCS_CSS}</style></head>"
    ).replace("</body>", f"{plan_script}</body>")
    return HTMLResponse(content=html)


@app.get(f"{settings.API_V1_STR}/health", include_in_schema=False)
async def health() -> dict[str, str]:
    return {"status": "ok"}


STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))

if os.path.isdir(STATIC_DIR):
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_index():
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return {"message": "ZensusTech API is running", "docs": f"{settings.API_V1_STR}/docs"}

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("backend-api/"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not Found")
else:
    @app.get("/", include_in_schema=False)
    async def root() -> dict[str, str]:
        return {"message": "ZensusTech API is running", "docs": f"{settings.API_V1_STR}/docs"}

