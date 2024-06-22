import { parseArgs } from "node:util";
import { dirname } from "node:path";
import fs from "node:fs";
import { z } from "zod";
import { parse as manifestParaser } from "./packages/manifest/src/mod.ts";
import { build } from "./packages/book/src/mod.ts";

const { values: parsed } = parseArgs({
  args: Deno.args,
  allowPositionals: true,
  options: {
    manifest: { type: "string", short: "m" },
  },
});
const argv = z.object({
  manifest: z.string().default("manifest.json"),
}).parse(parsed);
Deno.chdir(dirname(argv.manifest));

const [manifestFile] = (await Promise.all([
  fs.promises.readFile(argv.manifest, "utf8").catch(() => undefined),
  fs.promises.readFile("manifest.jsonc", "utf8").catch(() => undefined),
  fs.promises.readFile("manifest.json", "utf8").catch(() => undefined),
])).filter(Boolean);
if (manifestFile == null) {
  console.error("manifest file not found");
  Deno.exit(1);
}

const manifest = manifestParaser(manifestFile);

const file = await build(manifest);

fs.promises.mkdir(
  dirname(manifest.output ?? `${manifest.title}.epub`),
  { recursive: true },
);

fs.writeFileSync(
  manifest.output ?? `${manifest.title}.epub`,
  new Uint8Array(await file.arrayBuffer()),
);
