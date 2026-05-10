/**
 * Cache shim — not executed directly. Imported by consuming repos'
 * setup task so all task-script dependencies are included in deno.lock.
 */
import "./cron-template.ts";
import "./env.ts";
import "./fetch-template.ts";
import "./params.ts";
import "./webhook-template.ts";
