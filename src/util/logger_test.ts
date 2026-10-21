import { deepStrictEqual as assertEquals } from "node:assert";
import process from "node:process";
import log from "./logger.ts";

function capture(fn: () => void): Record<string, unknown> {
  const original = process.stdout.write;
  let output = "";
  process.stdout.write = ((chunk: string) => {
    output += chunk;
    return true;
  }) as typeof process.stdout.write;
  try {
    fn();
  } finally {
    process.stdout.write = original;
  }
  return JSON.parse(output);
}

Deno.test("logger serializes Error with cause", () => {
  const err = new Error("boom", { cause: new TypeError("inner") });
  const { msg } = capture(() => log.error("Handler error:", err)) as {
    msg: [string, Record<string, unknown>];
  };
  assertEquals(msg[0], "Handler error:");
  assertEquals(msg[1].name, "Error");
  assertEquals(msg[1].message, "boom");
  assertEquals(Array.isArray(msg[1].stack), true);
  assertEquals((msg[1].cause as Record<string, unknown>).name, "TypeError");
  assertEquals((msg[1].cause as Record<string, unknown>).message, "inner");
});

Deno.test("logger serializes nested Error and own props", () => {
  const err = Object.assign(new Error("bad gateway"), { status: 502 });
  const { msg } = capture(() => log.error({ err })) as {
    msg: { err: Record<string, unknown> };
  };
  assertEquals(msg.err.message, "bad gateway");
  assertEquals(msg.err.status, 502);
});

Deno.test("logger leaves non-Error values unchanged", () => {
  const { msg } = capture(() => log.info({ a: 1, b: "x" }));
  assertEquals(msg, { a: 1, b: "x" });
});
