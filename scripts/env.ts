/**
 * gen:env — Writes .tmp/.env.json with the resolved PARAMS_NAME and SERVICE_NAME
 */
import { getStack, root } from "./_utils.ts";
import { getParams } from "./params.ts";

export async function writeEnvFile(): Promise<void> {
  const envConfig = {
    // Scope must match resource name defined in Cloudformation (template.yml)
    Lambda: {
      PARAMS_NAME: await getParams(),
      SERVICE_NAME: await getStack(),
    },
  };
  await Deno.mkdir(root(".tmp"), { recursive: true });
  await Deno.writeTextFile(
    root(".tmp/.env.json"),
    JSON.stringify(envConfig, null, 2),
  );
  console.log("Written: .tmp/.env.json");
}

// no side-effects on import
if (import.meta.main) {
  await writeEnvFile();
}
