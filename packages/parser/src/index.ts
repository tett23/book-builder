import { unified } from "npm:unified@11.0.4";
import remarkParse from "npm:remark-parse@11.0.0";
import remarkGfm from "npm:remark-gfm@4.0.0";
import remarkRehype from "npm:remark-rehype@11.1.0";
import rehypeStringify from "npm:rehype-stringify@10.0.0";

export async function parser(source: string): Promise<string> {
  const file = await unified().use(remarkParse).use(remarkGfm).use(remarkRehype)
    .use(
      rehypeStringify,
    ).process(source);

  return file.toString();
}