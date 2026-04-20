export { createLambdaHandler } from "./handler.ts";
export { parseBoolEnv } from "./util/env.ts";
export { generateHMAC, verifyHMAC } from "./util/hmac.ts";
export { processEvents } from "./util/lambda.ts";
export { timeDifference } from "./util/time-difference.ts";

export {
  createConfigLoader,
  getAwsParams,
  getParam,
  setAwsParamsStatePath,
  TemporalInstantSchema,
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

// Dev tooling — task script utilities
import { getStack, root } from "../scripts/_utils.ts";
export const TaskUtils = { getStack, root };
