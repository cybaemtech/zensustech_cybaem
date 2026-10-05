import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/verify-azure", async (req, res) => {
  const { tenantId, clientId, clientSecret } = req.body || {};

  if (!tenantId?.trim() || !clientId?.trim() || !clientSecret?.trim()) {
    res.status(400).json({
      success: false,
      message: "Tenant ID, Client ID, and Client Secret are all required.",
    });
    return;
  }

  try {
    const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantId.trim())}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append("client_id", clientId.trim());
    params.append("client_secret", clientSecret.trim());
    params.append("grant_type", "client_credentials");
    params.append("scope", "https://graph.microsoft.com/.default");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const azureRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await azureRes.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON response from Azure
    }

    if (azureRes.ok && data.access_token) {
      const accessToken = data.access_token;
      let orgDetails = null;

      try {
        const orgRes = await fetch("https://graph.microsoft.com/v1.0/organization", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          if (orgData.value && orgData.value.length > 0) {
            const org = orgData.value[0];
            let primaryDomain = "";
            if (org.verifiedDomains) {
              const initialDomain = org.verifiedDomains.find((d: any) => d.isInitial);
              primaryDomain = initialDomain ? initialDomain.name : org.verifiedDomains[0]?.name;
            }
            orgDetails = {
              displayName: org.displayName,
              countryLetterCode: org.countryLetterCode,
              city: org.city,
              state: org.state,
              street: org.street,
              primaryDomain: primaryDomain,
            };
          }
        }
      } catch (err) {
        console.error("Failed to fetch organization details:", err);
      }

      res.json({
        success: true,
        message: "Successfully verified with Azure Active Directory.",
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        tenantId: tenantId.trim(),
        clientId: clientId.trim(),
        organization: orgDetails,
      });
      return;
    }

    let cleanMessage = data.error_description || data.error;
    if (!cleanMessage) {
      cleanMessage =
        azureRes.status === 404 || azureRes.status === 400
          ? "Tenant was not found or is invalid. Please check your Tenant ID."
          : `Azure returned error status ${azureRes.status}.`;
    } else {
      const traceIndex = cleanMessage.indexOf("Trace ID:");
      if (traceIndex !== -1) {
        cleanMessage = cleanMessage.slice(0, traceIndex).trim();
      }
      cleanMessage = cleanMessage.replace(/^AADSTS\d+:\s*/, "");
    }

    res.status(400).json({
      success: false,
      error: data.error || "azure_error",
      message: cleanMessage,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.name === "AbortError"
        ? "Connection to Azure timed out. Please check your network connection."
        : `Could not reach Azure endpoint: ${err.message}`,
    });
  }
});

export default router;
