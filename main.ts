import { parser } from "./packages/parser/src/mod.ts";
import {
  Manifest,
  parse as manifestParaser,
} from "./packages/manifest/src/mod.ts";
import { parseArgs } from "node:util";
import { Volume } from "npm:memfs@4.9.2";
import rfs from "node:fs";
import { Union } from "npm:unionfs@4.5.4";
import { dirname } from "node:path";
import embedded from "./embed/static/dir.ts";
import Handlebars from "handlebars";
import { z } from "zod";
import {
  BlobWriter,
  TextReader,
  ZipWriter,
} from "https://deno.land/x/zipjs@v2.7.45/index.js";

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

const pfs: typeof rfs = Volume.fromJSON({}) as never;
const ufs = new Union();
const fs: typeof rfs = ufs.use(pfs).use(rfs) as never;

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

const contents = await Promise.all(manifest.index.map(async (
  item,
): Promise<[UnwrapArray<Manifest["index"]>, string]> =>
  [item, await parser(fs.readFileSync(item.src, "utf8"))] as const
));

type Book = {
  title: string;
  author: string;
  bookInfo: Manifest["bookInfo"];
  index: Array<
    {
      type: "chapter" | "section";
      id: string;
      title: string;
      noIndex?: boolean;
      content: string;
    } | {
      type: "misc";
      id: string;
      title: string;
      content: string;
    }
  >;
};

type UnwrapArray<T> = T extends { [K in keyof T]: infer U } ? U : never;

function fromManifestAndContent(
  manifest: Manifest,
  contents: readonly [UnwrapArray<Manifest["index"]>, string][],
): Book {
  return {
    title: manifest.title,
    author: manifest.author,
    bookInfo: manifest.bookInfo,
    index: contents.map(([item, content], idx) => {
      return { ...item, id: `item-${idx}`, content };
    }),
  };
}

function compile(book: Book): Promise<[string, string][]> {
  return Promise.all([
    copyFile("mimetype"),
    copyFile("META-INF/container.xml"),
    copyFile("EPUB/page.css"),
    copyFile("EPUB/stylesheet.css"),
    compileTemplate("EPUB/content.opf.mustache", "EPUB/content.opf", book),
    compileTemplate(
      "EPUB/html/nav.html.mustache",
      "EPUB/html/nav.html",
      book,
    ),
    book.index.map((item) =>
      compileTemplate(
        "EPUB/html/body.html.mustache",
        `EPUB/html/${item.id}.html`,
        item,
      )
    ),
  ].flat());
}

async function copyFile(path: string): Promise<[string, string]> {
  return [path, await (await embedded.get(path))?.text() ?? ""];
}

async function compileTemplate(
  templatePath: string,
  outPath: string,
  book: unknown,
): Promise<[string, string]> {
  return [
    outPath,
    Handlebars.compile(
      await (await embedded.get(templatePath))?.text(),
    )(
      book,
    ),
  ];
}

async function zip(
  files: [string, string][],
): Promise<Blob> {
  const zipFileWriter = new BlobWriter();
  const writer = new ZipWriter(zipFileWriter);
  await files.reduce(
    async (acc: Promise<unknown>, [path, content]) => {
      await acc;
      await writer.add(path, new TextReader(content), { keepOrder: true });
    },
    Promise.resolve(),
  );
  await writer.close();

  return zipFileWriter.getData();
}

const book = fromManifestAndContent(manifest, contents);
const file = await zip(await compile(book));
const ab = await file.arrayBuffer();

fs.promises.mkdir(
  dirname(manifest.output ?? `${manifest.title}.epub`),
  { recursive: true },
);

rfs.writeFileSync(
  manifest.output ?? `${manifest.title}.epub`,
  new Uint8Array(ab),
);
