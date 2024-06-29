import type {
  PhrasingContent,
  Root,
  RootContent,
} from "npm:@types/mdast@4.0.0";
import { is } from "unist-util-is";
import { u } from "unist-builder";

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

        return {
          type: "paragraph",
          children: reduceComment(
            { stack: [], isComment: false },
            splitAtCommentDelimiter(node.children),
          ) as never,
        };
      },
    ),
  };

  return newRoot;
}

type CommentFragment = { type: "commentFragment" };
type Comment = { type: "comment"; children: PhrasingContent[] };

function splitAtCommentDelimiter(
  nodes: PhrasingContent[],
): Array<
  PhrasingContent | CommentFragment
> {
  const [node, ...tail] = nodes;
  if (node == null) {
    return [];
  }

  if (!is(node, "text") || node.value === "") {
    return [node, ...splitAtCommentDelimiter(tail)];
  }

  const current = node.value.split(Delimiter).reduce(
    (acc: Array<PhrasingContent | CommentFragment>, item) => {
      acc.push(u("text", { value: item }));
      acc.push(u("commentFragment"));
      return acc;
    },
    [],
  );

  return [...current.slice(0, -1), ...splitAtCommentDelimiter(tail)];
}

type State = { stack: PhrasingContent[]; isComment: boolean };

function reduceComment(
  { isComment, stack }: State,
  nodes: Array<PhrasingContent | CommentFragment>,
): Array<PhrasingContent | Comment> {
  if (nodes.length === 0) {
    return stack;
  }

  const [node, ...tail] = nodes;
  if (node == null) {
    return [];
  }
  if (node.type === "commentFragment" && isComment) {
    return [
      u("comment", { children: stack }),
      ...reduceComment({ isComment: false, stack: [] }, tail),
    ];
  }
  if (node.type === "commentFragment") {
    return reduceComment({ isComment: true, stack: [] }, tail);
  }

  return isComment
    ? reduceComment({ isComment, stack: [node, ...stack] }, tail)
    : [node, ...reduceComment({ isComment, stack }, tail)];
}
