// Fetches shared base CloudFormation template from integration-core.
// Version is read from the @hls/integration-core import map entry in deno.jsonc — single source of truth.

const SHARED_ORG = "HarvardLawSchool";
const SHARED_REPO = "integration-core";

async function resolveRef(): Promise<string> {
  try {
    const content = await Deno.readTextFile("deno.jsonc")
      .catch(() => Deno.readTextFile("deno.json"));
    const match = content.match(/integration-core\/([^/]+)\/src\/mod\.ts/);
    if (match) return match[1];
  } catch {
    // file not found or unreadable
  }
  console.warn(
    "Could not parse ref from deno.jsonc imports — falling back to main",
  );
  return "main";
}

const force = Deno.args.includes("--force");

try {
  const { isFile } = await Deno.stat("template.yml");
  if (isFile && !force) {
    console.log("template.yml exists — skipping (pass --force to re-fetch)");
    Deno.exit(0);
  }
} catch {
  // doesn't exist, continue
}

const ref = await resolveRef();
const url =
  `https://raw.githubusercontent.com/${SHARED_ORG}/${SHARED_REPO}/${ref}/template.yml`;

console.log(`Fetching shared template @ ${ref}`);
const res = await fetch(url);
if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);

await Deno.writeTextFile("template.yml", await res.text());
console.log("Wrote template.yml");
