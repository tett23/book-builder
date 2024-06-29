import { unified } from "npm:unified@11.0.4";
import remarkParse from "npm:remark-parse@11.0.0";
import remarkGfm from "npm:remark-gfm@4.0.0";
import remarkRehype from "npm:remark-rehype@11.1.0";
import rehypeStringify from "npm:rehype-stringify@10.0.0";
import { remove } from "npm:unist-util-remove@4";
import { remarkParagraphBreaks } from "./remarkParagraphBreaks.ts";
import { remarkComments } from "./remarkComments.ts";
import { Root } from "npm:@types/mdast@4.0.0";

export async function parser(source: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkComments)
    .use(remarkParagraphBreaks)
    .use(remarkRemoeEmpty)
    .use(remarkRehype)
    .use(
      rehypeStringify,
      { closeSelfClosing: true },
    )
    .process(source);

  return file.toString();
}

function remarkRemoeEmpty() {
  return (root: Root) => {
    remove(
      root,
      // deno-lint-ignore no-explicit-any
      ((node: any) => node.value != null && node.value === "") as never,
    );
    remove(
      root,
      // deno-lint-ignore no-explicit-any
      (node: any) => node.type === "comment",
    );
    remove(
      root,
      // deno-lint-ignore no-explicit-any
      (node: any) => node.type === "paragraph" && node.children.length === 0,
    );
  };
}
