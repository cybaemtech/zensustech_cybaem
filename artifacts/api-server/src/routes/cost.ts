import { Router, type IRouter } from "express";
import { CostService } from "../services/cloud-cost/CostService";
import { requireRole } from "../middlewares/auth";
import { AuditLogger } from "../services/AuditLogger";

const router: IRouter = Router();

// Only CXO, CTO, and IT Admins can view cost data
router.get("/cost/subscriptions", requireRole(["CXO", "CTO", "IT_ADMIN"]), async (req, res) => {
  const { tenant_id, client_id, client_secret, provider = "AZURE" } = req.headers as any;
  const user = (req as any).user;

  if (!tenant_id || !client_id || !client_secret) {
    res.status(400).json({ error: "Missing cloud credentials in headers" });
    return;
  }

  try {
    const costProvider = await CostService.getProvider(provider.toUpperCase(), {
      tenantId: tenant_id,
      clientId: client_id,
      clientSecret: client_secret
    });

    const subscriptions = await costProvider.getSubscriptions();
    AuditLogger.logAction(user.id, "VIEW_SUBSCRIPTIONS", provider, { subscriptionCount: subscriptions.length });
    
    res.json({ success: true, data: subscriptions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/cost/query", requireRole(["CXO", "CTO", "IT_ADMIN"]), async (req, res) => {
  const { tenant_id, client_id, client_secret, provider = "AZURE" } = req.headers as any;
  const { scope, startDate, endDate } = req.body;
  const user = (req as any).user;

  if (!tenant_id || !client_id || !client_secret) {
    res.status(400).json({ error: "Missing cloud credentials in headers" });
    return;
  }

  if (!scope || !startDate || !endDate) {
    res.status(400).json({ error: "Missing scope, startDate, or endDate in body" });
    return;
  }

  try {
    const costProvider = await CostService.getProvider(provider.toUpperCase(), {
      tenantId: tenant_id,
      clientId: client_id,
      clientSecret: client_secret
    });

    const costData = await costProvider.getCostData(scope, startDate, endDate);
    AuditLogger.logAction(user.id, "VIEW_COST_DATA", scope, { startDate, endDate, totalCost: costData.totalCost });

    res.json({ success: true, data: costData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
