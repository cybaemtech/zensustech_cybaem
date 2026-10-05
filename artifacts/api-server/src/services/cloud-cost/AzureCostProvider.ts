import { ICostProvider, CloudSubscription, CostData } from "./ICostProvider";

export class AzureCostProvider implements ICostProvider {
  private accessToken: string | null = null;
  private tenantId: string = "";

  async authenticate(credentials: { tenantId: string; clientId: string; clientSecret: string }): Promise<boolean> {
    const { tenantId, clientId, clientSecret } = credentials;
    this.tenantId = tenantId;

    const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantId.trim())}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append("client_id", clientId.trim());
    params.append("client_secret", clientSecret.trim());
    params.append("grant_type", "client_credentials");
    params.append("scope", "https://management.azure.com/.default"); // Scope for Azure Resource Manager / Cost Management

    try {
      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const data = await res.json();
      
      if (res.ok && data.access_token) {
        this.accessToken = data.access_token;
        return true;
      }
      return false;
    } catch (err) {
      console.error("Azure Authentication Failed:", err);
      return false;
    }
  }

  async getSubscriptions(): Promise<CloudSubscription[]> {
    if (!this.accessToken) throw new Error("Not authenticated");

    try {
      const res = await fetch("https://management.azure.com/subscriptions?api-version=2020-01-01", {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      
      if (!res.ok) throw new Error(`Failed to fetch subscriptions: ${res.statusText}`);
      const data = await res.json();

      return (data.value || []).map((sub: any) => ({
        id: sub.subscriptionId,
        name: sub.displayName,
        state: sub.state,
      }));
    } catch (err) {
      console.error("Azure getSubscriptions Failed:", err);
      return [];
    }
  }

  async getCostData(scope: string, startDate: string, endDate: string): Promise<CostData> {
    if (!this.accessToken) throw new Error("Not authenticated");
    
    // Azure Cost Management API requires scope in format: /subscriptions/{subscriptionId}
    const formattedScope = scope.startsWith("/subscriptions/") ? scope : `/subscriptions/${scope}`;
    const url = `https://management.azure.com${formattedScope}/providers/Microsoft.CostManagement/query?api-version=2023-03-01`;

    const payload = {
      type: "Usage",
      timeframe: "Custom",
      timePeriod: {
        from: startDate,
        to: endDate,
      },
      dataset: {
        granularity: "Daily",
        aggregation: {
          totalCost: {
            name: "PreTaxCost",
            function: "Sum"
          }
        },
        grouping: [
          {
            type: "Dimension",
            name: "ServiceName"
          }
        ]
      }
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Failed to fetch cost data: ${res.statusText}`);
      const data = await res.json();
      
      // Parse Azure Cost Management response format
      let totalCost = 0;
      let currency = "USD";
      const breakdown: Array<{name: string, cost: number}> = [];

      if (data.properties && data.properties.rows) {
        for (const row of data.properties.rows) {
          const cost = row[0]; // Assuming PreTaxCost is first
          const date = row[1]; // Date
          const serviceName = row[2]; // ServiceName
          currency = row[3] || "USD"; // Currency

          totalCost += cost;
          
          const existing = breakdown.find(b => b.name === serviceName);
          if (existing) {
            existing.cost += cost;
          } else {
            breakdown.push({ name: serviceName, cost });
          }
        }
      }

      return {
        totalCost,
        currency,
        breakdown,
      };

    } catch (err) {
      console.error("Azure getCostData Failed:", err);
      throw err;
    }
  }
}
