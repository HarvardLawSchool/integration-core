export { createLambdaHandler } from "./handler.ts";
export { TemporalInstantSchema } from "./schema.ts";
export { parseBoolEnv } from "./util/env.ts";
export { generateHMAC, verifyHMAC } from "./util/hmac.ts";
export { processEvents } from "./util/lambda.ts";
export { timeDifference } from "./util/time-difference.ts";

export {
  createConfigLoader,
  getAwsParams,
  getParam,
  setAwsParamsStatePath,
} from "./util/aws-params.ts";

export {
  addLogContext,
  default as log,
  useCustomConsoleLogger,
} from "./util/logger.ts";

export {
  validateWebhookSignature,
  type WebhookEvent,
  WebhookEventSchema,
  WebhookRequestSchema,
} from "./util/webhook.ts";

export type {
  ApiEvent,
  ApiResult,
  LambdaContext,
  LambdaEventSource,
  LambdaHandler,
  ScheduledJobResponse,
} from "./lambda-types.ts";

export { getStack, root as projectRoot } from "../scripts/_utils.ts";

// Task script re-exports, ensures deno.lock coverage via static analysis on `deno install`.
export { writeCronTemplate } from "../scripts/cron-template.ts";
export { writeEnvFile } from "../scripts/env.ts";
export { fetchTemplate } from "../scripts/fetch-template.ts";
export { getParams } from "../scripts/params.ts";
export { writeWebhookTemplate } from "../scripts/webhook-template.ts";
