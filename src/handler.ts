import type { LambdaHandler } from "./lambda-types.ts";
import { addLogContext, useCustomConsoleLogger } from "./util/logger.ts";

export interface HandlerOptions {
  webhook?: LambdaHandler;
  scheduled?: LambdaHandler;
}

const ErrorResponse = { statusCode: 500 };

export function createLambdaHandler(options: HandlerOptions): LambdaHandler {
  useCustomConsoleLogger();

  return async (event, context) => {
    const { awsRequestId, source } = context;
    addLogContext({ awsRequestId, source });

    if (context.isEventBridge) {
      if (!options.scheduled) {
        console.error("Scheduled access not enabled for this function");
        return ErrorResponse;
      }
      return await options.scheduled(event, context);
    }

    if (context.isHttp) {
      const TRIGGER_TYPE = Deno.env.get("TRIGGER_TYPE") ?? "both";
      if (TRIGGER_TYPE === "webhook" || TRIGGER_TYPE === "both") {
        if (!options.webhook) {
          console.error("Webhook handler not defined");
          return ErrorResponse;
        }
        return await options.webhook(event, context);
      }
      console.error("Webhook access not enabled for this function");
      return ErrorResponse;
    }

    return ErrorResponse;
  };
}
