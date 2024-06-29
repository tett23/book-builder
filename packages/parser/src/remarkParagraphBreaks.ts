import { Paragraph, Root, RootContent } from "npm:@types/mdast@4";

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
            const prev: Paragraph = acc[acc.length - 1] ??
              { type: "paragraph", children: [] };
            if (node.type !== "text") {
              prev.children.push(node);
              return acc;
            }

            const [head, ...tail] = node.value.split(/\r\n|\r|\n/);
            if (head == null) {
              throw new Error("head is null");
            }
            prev.children.push({ type: "text", value: head });
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

    return newRoot;
  };
}
