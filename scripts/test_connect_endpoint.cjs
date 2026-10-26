async function testConnect() {
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error("Set AZURE_CLIENT_SECRET before running this test.");
  }

  const payload = {
    tenantId: "9414ece9-9039-40b7-a6a7-7ecbe7409245",
    clientId: "0ffa2118-1e76-4537-b0d4-0ad853240893",
    clientSecret
  };
  const res = await fetch("http://127.0.0.1:8010/api/v1/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  console.log("Connect status:", res.status);
  const data = await res.json();
  console.log("Has graph_token:", !!data.graph_token, "has mgmt_token:", !!data.mgmt_token);
}
testConnect();
