import { deepStrictEqual as assertEquals, rejects } from "node:assert";
import type { ApiEvent } from "../lambda-types.ts";
import { generateHMAC } from "./hmac.ts";
import { validateWebhookSignature, WebhookRequestSchema } from "./webhook.ts";

const SECRET = "test-secret";
const MINUTE = 60 * 1000;

function makeBody(offsetMs = 0): string {
  return JSON.stringify({
    type: "test",
    data: { id: "1" },
    timestamp: new Date(Date.now() + offsetMs).toISOString(),
  });
}

function makeEvent(body: string | null, signature?: string): ApiEvent {
  return {
    version: "2.0",
    routeKey: "$default",
    rawPath: "/",
    body,
    headers: signature ? { "x-webhook-signature": signature } : {},
  };
}

async function signedEvent(
  offsetMs = 0,
  prefix = "sha256=",
): Promise<ApiEvent> {
  const body = makeBody(offsetMs);
  return makeEvent(body, prefix + await generateHMAC(body, SECRET));
}

Deno.test("accepts fresh event with sha256= signature", async () => {
  await validateWebhookSignature(await signedEvent(), SECRET);
});

Deno.test("accepts fresh event with bare hex signature", async () => {
  await validateWebhookSignature(await signedEvent(0, ""), SECRET);
});

Deno.test("accepts uppercase signature header name", async () => {
  const body = makeBody();
  const event = makeEvent(body);
  event.headers = {
    "X-Webhook-Signature": `sha256=${await generateHMAC(body, SECRET)}`,
  };
  await validateWebhookSignature(event, SECRET);
});

Deno.test("rejects wrong signature", async () => {
  const body = makeBody();
  const sig = await generateHMAC(body, "other-secret");
  await rejects(
    validateWebhookSignature(makeEvent(body, `sha256=${sig}`), SECRET),
    { message: "Invalid webhook signature" },
  );
});

Deno.test("rejects stale timestamp (replay)", async () => {
  await rejects(
    validateWebhookSignature(await signedEvent(-10 * MINUTE), SECRET),
    { message: "Webhook timestamp outside allowed window" },
  );
});

Deno.test("rejects future timestamp", async () => {
  await rejects(
    validateWebhookSignature(await signedEvent(10 * MINUTE), SECRET),
    { message: "Webhook timestamp outside allowed window" },
  );
});

Deno.test("accepts timestamp within window", async () => {
  await validateWebhookSignature(await signedEvent(-4 * MINUTE), SECRET);
});

Deno.test("rejects validly signed body without timestamp", async () => {
  const body = JSON.stringify({ type: "test" });
  const sig = await generateHMAC(body, SECRET);
  await rejects(
    validateWebhookSignature(makeEvent(body, `sha256=${sig}`), SECRET),
  );
});

Deno.test("rejects Stripe-style header", async () => {
  const body = makeBody();
  const sig = await generateHMAC(body, SECRET);
  await rejects(
    validateWebhookSignature(makeEvent(body, `t=123,v1=${sig}`), SECRET),
    { message: "Invalid webhook signature" },
  );
});

Deno.test("rejects missing body or signature", async () => {
  const sig = await generateHMAC("x", SECRET);
  await rejects(
    validateWebhookSignature(makeEvent(null, `sha256=${sig}`), SECRET),
    { message: "Invalid webhook request" },
  );
  await rejects(
    validateWebhookSignature(makeEvent(makeBody()), SECRET),
    { message: "Invalid webhook request" },
  );
});

Deno.test("WebhookRequestSchema accepts sha256= and rejects v1=", () => {
  const body = makeBody();
  const hex = "a".repeat(64);
  const ok = WebhookRequestSchema.safeParse({
    body,
    headers: { "X-Webhook-Signature": `sha256=${hex}` },
  });
  assertEquals(ok.success, true);
  const bad = WebhookRequestSchema.safeParse({
    body,
    headers: { "x-webhook-signature": `v1=${hex}` },
  });
  assertEquals(bad.success, false);
});
