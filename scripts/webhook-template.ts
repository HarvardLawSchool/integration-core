import { generateHMAC, getParam, TaskUtils } from "@hls/integration-core";

const dataId = Deno.env.get("DATA_ID");
const eventType = Deno.env.get("EVENT_TYPE");

// Default body matches WebhookEventSchema — override via WEBHOOK_BODY env var
const body = Deno.env.get("WEBHOOK_BODY") ?? JSON.stringify({
  type: eventType ?? "test",
  data: { id: dataId ?? "test" },
  timestamp: new Date().toISOString(),
});

const paramsName = `/integrations/${await TaskUtils.getStack()}`;
const blob = JSON.parse(await getParam(paramsName));
const webhookSecret = blob.WEBHOOK_SECRET;
if (!webhookSecret) throw new Error("WEBHOOK_SECRET not found in config blob");

const signature = await generateHMAC(body, webhookSecret);

const event = {
  version: "2.0",
  routeKey: "$default",
  rawPath: "/",
  headers: {
    "content-type": "application/json",
    "user-agent": "webhook-client",
    "x-webhook-signature": `sha256=${signature}`,
  },
  requestContext: {
    http: {
      method: "POST",
      path: "/",
      protocol: "HTTP/1.1",
      sourceIp: "127.0.0.1",
    },
    requestId: "test-request-123",
    time: "03/Nov/2025:01:02:03 +0000",
    timeEpoch: 1730596923000,
  },
  body,
  isBase64Encoded: false,
};

await Deno.writeTextFile(
  TaskUtils.root(".tmp/webhook-event.json"),
  JSON.stringify(event, null, 2),
);

console.log("Written: .tmp/webhook-event.json");
