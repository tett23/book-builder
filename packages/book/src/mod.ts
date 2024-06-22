import type { Manifest } from "../../manifest/src/mod.ts";
import { parser } from "../../parser/src/mod.ts";
import embedded from "../../../embed/static/dir.ts";
import {
  BlobWriter,
  TextReader,
  ZipWriter,
} from "https://deno.land/x/zipjs@v2.7.45/index.js";
import Handlebars from "handlebars";
import fs from "node:fs";
import { dirname } from "node:path";

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

export async function build(manifest: Manifest): Promise<Blob> {
  const contents = await Promise.all(manifest.index.map(async (
    item,
  ): Promise<[UnwrapArray<Manifest["index"]>, string]> =>
    [item, await parser(fs.readFileSync(item.src, "utf8"))] as const
  ));

  const book = fromManifestAndContent(manifest, contents);

  return await zip(await compile(book));
}
