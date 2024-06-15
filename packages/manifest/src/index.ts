import {
  parse as jsoncParse,
} from "https://deno.land/std@0.224.0/jsonc/mod.ts";
import { z } from "zod";

const Chapter = z.object({
  type: z.literal("chapter"),
  title: z.string(),
  src: z.string(),
  noIndex: z.boolean().optional(),
});

const Section = z.object({
  type: z.literal("section"),
  title: z.string(),
  src: z.string(),
  noIndex: z.boolean().optional(),
});

const Manifest = z.object({
  title: z.string(),
  author: z.string(),
  index: z.array(z.union([Chapter, Section])),
  bookInfo: z.object({
    uniqueId: z.string().default(`urn:uuid${crypto.randomUUID()}`),
    language: z.string().default("ja-JP"),
    pageProgressionDirection: z.union([z.literal("ltr"), z.literal("rtl")]),
    modified: z.string().default(new Date().toISOString()),
    version: z.string().default("0.0.0"),
  }).default({
    uniqueId: `urn:uuid${crypto.randomUUID()}`,
    language: "ja-JP",
    pageProgressionDirection: "rtl",
    modified: new Date().toISOString(),
    version: "0.0.0",
  }),
});

export type Manifest = z.infer<typeof Manifest>;

export function parse(
  source: string,
): z.SafeParseReturnType<Manifest, Manifest> {
  return Manifest.safeParse(jsoncParse(source));
}
