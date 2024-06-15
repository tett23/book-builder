import { Paragraph, Root, RootContent } from "npm:@types/mdast@4.0.0";
import { remove } from "npm:unist-util-remove@4";

export function remarkParagraphBreaks() {
  return (root: Root): Root => {
    const newRoot = {
      ...root,
      children: root.children.flatMap(
        (node: RootContent): RootContent[] => {
          if (node.type !== "paragraph") {
            return [node];
          }

          const paragraphs = node.children.reduce((acc: Paragraph[], node) => {
            if (node.type !== "text") {
              acc[acc.length - 1].children.push(node);
              return acc;
            }

            const [head, ...tail] = node.value.split(/\r\n|\r|\n/);
            acc[acc.length - 1].children.push({ type: "text", value: head });
            tail.forEach((tail) => {
              acc.push(
                {
                  type: "paragraph",
                  children: [{ type: "text", value: tail }],
                },
              );
            });

            return acc;
          }, [
            { type: "paragraph", children: [] },
          ]);

          return paragraphs;
        },
      ),
    };
    remove(
      newRoot as never,
      // deno-lint-ignore no-explicit-any
      ((node: any) => node.value != null && node.value === "") as never,
    );
    remove(
      newRoot as never,
      // deno-lint-ignore no-explicit-any
      (node: any) => node.type === "paragraph" && node.children.length === 0,
    );

    return newRoot;
  };
}
