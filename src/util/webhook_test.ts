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

/** Vendor format: local time with offset, no millis, e.g. "2026-11-19T09:51:28-05:00" */
function offsetTimestamp(offsetMs = 0): string {
  const local = new Date(Date.now() + offsetMs - 5 * 60 * MINUTE);
  return local.toISOString().slice(0, 19) + "-05:00";
}

function vendorBody(offsetMs = 0): string {
  return JSON.stringify({
    type: "primary_appointment.updated",
    timestamp: offsetTimestamp(offsetMs),
    data: { id: "01a1a852-52cf-7de1-a0da-9c2e4ddfc898" },
  });
}

Deno.test("accepts vendor event with offset timestamp", async () => {
  const body = vendorBody();
  const sig = await generateHMAC(body, SECRET);
  await validateWebhookSignature(makeEvent(body, `sha256=${sig}`), SECRET);
});

Deno.test("rejects stale vendor event with offset timestamp", async () => {
  const body = vendorBody(-10 * MINUTE);
  const sig = await generateHMAC(body, SECRET);
  await rejects(
    validateWebhookSignature(makeEvent(body, `sha256=${sig}`), SECRET),
    { message: "Webhook timestamp outside allowed window" },
  );
});

Deno.test("WebhookRequestSchema accepts offset timestamp", () => {
  const parsed = WebhookRequestSchema.safeParse({
    body: vendorBody(),
    headers: { "X-Webhook-Signature": `sha256=${"a".repeat(64)}` },
  });
  assertEquals(parsed.success, true);
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
