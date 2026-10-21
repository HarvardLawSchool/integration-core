import log from "loglevel";
import process from "node:process";

type LogContext = Record<string, unknown>;

let currentContext: LogContext = {};

export function addLogContext(ctx: LogContext) {
  currentContext = { ...currentContext, ...(ctx ?? {}) };
}

// handle Error instance details differently -- avoids JSON.stringify eval to "{}"
function errorReplacer(_key: string, value: unknown) {
  if (value instanceof Error) {
    return {
      ...value,
      name: value.name,
      message: value.message,
      stack: value.stack?.split("\n"),
      ...(value.cause !== undefined && { cause: value.cause }),
    };
  }
  return value;
}

// IMPORTANT Set factory BEFORE setLevel
log.methodFactory = (methodName, _logLevel, _loggerName) => {
  return (...args: unknown[]) => {
    const msg = args.length === 1 ? args[0] : args;
    const jsonMessage = JSON.stringify({
      timestamp: Temporal.Now.instant().toZonedDateTimeISO("America/New_York")
        .toString(),
      level: methodName.toUpperCase(),
      msg,
      ...currentContext,
    }, errorReplacer) + "\n";
    process.stdout.write(jsonMessage);
  };
};

// Now setLevel — triggers replaceLoggingMethods() with the custom factory above

// Gracefully fall back to "info" if env access is not permitted
let logLevel: string | undefined;
try {
  logLevel = Deno.env.get("LOG_LEVEL")?.toLowerCase();
} catch {
  // no env permission — default to info
}

switch (logLevel) {
  case "trace":
    log.setLevel("trace");
    break;
  case "debug":
    log.setLevel("debug");
    break;
  case "warn":
    log.setLevel("warn");
    break;
  case "error":
    log.setLevel("error");
    break;
  default:
    log.setLevel("info");
}

export default log;

/**
 * Overrides console methods with structured JSON logging.
 * Call once at Lambda handler entry point. Use addLogContext
 * to inject Lambda/other info to all console.* methods
 */
export function useCustomConsoleLogger() {
  console.trace = log.trace;
  console.debug = log.debug;
  console.info = log.info;
  console.log = log.info;
  console.warn = log.warn;
  console.error = log.error;
}
