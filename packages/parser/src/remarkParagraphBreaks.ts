import { Paragraph, Root, RootContent } from "npm:@types/mdast@4.0.0";

export function remarkParagraphBreaks() {
  return (root: Root) => {
    root.children = root.children.flatMap(
      (node: RootContent): RootContent[] => {
        if (node.type !== "paragraph") {
          return node as never;
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
              } as const,
            );
          });

          return acc;
        }, [
          { type: "paragraph", children: [] as Paragraph["children"] },
        ]);

        return paragraphs;
      },
    );
  };
}
