const TRUTHY = ["true", "1"];

export const parseBoolEnv = (key: string): boolean =>
  TRUTHY.includes(Deno.env.get(key) ?? "");
