const fs = require("fs");
const path = require("path");

async function test() {
  const credsPath = path.resolve(__dirname, "../data/sessions.json");
  const creds = JSON.parse(fs.readFileSync(credsPath, "utf8"));
  const session = Object.values(creds)[0];
  const { tenant_id, client_id, client_secret } = session;
  const p = new URLSearchParams({
    client_id,
    client_secret,
    grant_type: "client_credentials",
    scope: "https://graph.microsoft.com/.default"
  });
  const tRes = await fetch(`https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: p
  });
  const tJson = await tRes.json();
  const token = tJson.access_token;
  console.log("Token obtained. Now calling backend http://127.0.0.1:8010/api/v1/tenant/users ...");
  try {
    const res = await fetch("http://127.0.0.1:8010/api/v1/tenant/users", {
      headers: { "X-Graph-Token": token }
    });
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Response:", JSON.stringify(json).substring(0, 300));
  } catch (e) {
    console.error("Backend call failed:", e.message);
  }
}
test();
