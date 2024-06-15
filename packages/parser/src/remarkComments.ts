import { PhrasingContent, Root, RootContent } from "npm:@types/mdast@4.0.0";
import { remove } from "npm:unist-util-remove@4";

export function remarkComments() {
  return (root: Root): Root => {
    return inlineComment(root);
  };
}

const Delimiter = "%%";

function inlineComment(root: Root): Root {
  const newRoot = {
    ...root,
    children: root.children.flatMap(
      (node: RootContent): RootContent => {
        if (node.type !== "paragraph") {
          return node;
        }

        return { type: "paragraph", children: eat(node.children, []) as never };
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
}

function eat(
  nodes: PhrasingContent[],
  stack: Array<
    PhrasingContent
  >,
): Array<
  PhrasingContent | { type: "comment"; children: PhrasingContent[] }
> {
  if (nodes.length === 0) {
    return stack;
  }

  const [head, ...tail] = nodes;
  if (head.type !== "text") {
    return eat(tail, [...stack, head]);
  }
  if (head.value === "") {
    return eat(tail, stack);
  }

  const [before, comment, ...after] =
    ((): [string | undefined, string | undefined, ...string[]] => {
      if (stack.length === 0) {
        return head.value.split(Delimiter) as never;
      }
      const [comment, ...after] = head.value.split(Delimiter);
      return [undefined, comment, ...after];
    })();
  const rest = [
    { type: "text" as const, value: after.filter(Boolean).join(Delimiter) },
    ...tail,
  ].filter(
    (node) => !(node.type === "text" && node.value === ""),
  );

  if (stack.length !== 0 && comment == null) {
    return [
      { type: "text", value: before ?? "" },
      { type: "comment", children: stack },
      ...eat(rest, []),
    ];
  }
  if (comment != null) {
    return [
      { type: "text", value: before ?? "" },
      ...eat(rest, [{ type: "text", value: comment }]),
    ];
  }

  return [
    ...eat(rest, [...stack, { type: "text", value: before ?? "" }]),
  ];
}
