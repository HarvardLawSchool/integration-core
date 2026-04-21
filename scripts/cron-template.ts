/**
 * gen:cron-template — Writes .tmp/cron-event.json with STACK_NAME substituted
 */
import { getStack, root } from "./_utils.ts";

const stack = await getStack();

await Deno.writeTextFile(
  root(".tmp/cron-event.json"),
  JSON.stringify({ source: "eventbridge.schedule", service: stack }, null, 2),
);

console.log("Written: .tmp/cron-event.json");
