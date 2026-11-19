import { z } from "zod";
import { ApiEvent } from "../lambda-types.ts";
import { verifyHMAC } from "./hmac.ts";

/** Max age (either direction, to tolerate clock skew) of a signed event's timestamp */
export const WEBHOOK_MAX_AGE_MS = 5 * 60 * 1000;

/**
 * Verifies the HMAC signature, then rejects events whose signed `timestamp`
 * is outside WEBHOOK_MAX_AGE_MS (limits replay of captured requests).
 */
export async function validateWebhookSignature(
  event: ApiEvent,
  webhookSecret: string,
): Promise<void> {
  const headers = new Headers(event.headers);
  const signature = headers.get("x-webhook-signature"); // headers.get is case insensitive

  if (!event.body || !signature) {
    throw new Error("Invalid webhook request");
  }

  const isValid = await verifyHMAC(
    event.body,
    webhookSecret,
    signature,
  );

  if (!isValid) {
    throw new Error("Invalid webhook signature");
  }

  // Only trust the body after the signature is verified
  const { timestamp } = WebhookEventSchema.parse(JSON.parse(event.body));
  const age = Math.abs(Date.now() - Date.parse(timestamp));
  if (!(age <= WEBHOOK_MAX_AGE_MS)) { // also rejects NaN
    throw new Error("Webhook timestamp outside allowed window");
  }
}

export const WebhookEventSchema = z.object({
  type: z.string().optional(),
  // Vendor sends local time with an offset, e.g. "2026-11-19T09:51:28-05:00"
  timestamp: z.iso.datetime({ offset: true }),
  data: z.unknown().optional(),
});
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

const SignatureSchema = z.string().regex(
  /^(sha256=)?[a-f0-9]{64}$/i,
  "Invalid webhook signature hash",
);
export const WebhookRequestSchema = z.object({
  body: z.string().transform((str) =>
    WebhookEventSchema.parse(JSON.parse(str))
  ),
  // ensure the header is present and correctly formatted
  // validation handled util/hmac.ts
  // (preprocess for case-insensitivity)
  headers: z.preprocess(
    (headers) => {
      if (typeof headers !== "object" || !headers) return {};
      return Object.fromEntries(
        Object.entries(headers as Record<string, unknown>).map((
          [k, v],
        ) => [k.toLowerCase(), v]),
      );
    },
    z.object({
      "x-webhook-signature": SignatureSchema,
    }),
  ),
});
