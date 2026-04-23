import { z } from "zod";
import { ApiEvent } from "../lambda-types.ts";
import { verifyHMAC } from "./hmac.ts";

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
}

export const WebhookEventSchema = z.object({
  type: z.string().optional(),
  timestamp: z.iso.datetime(),
  data: z.unknown().optional(),
});
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

const SignatureSchema = z.string().regex(
  /^(sha256=|v1=)?[a-f0-9]{64}$/i,
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
