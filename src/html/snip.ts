import { VDOMNode } from "./vdom";

type NodePath = number[];

export const snipIndicator = "[...]";

export function snipAtDepth(node: VDOMNode, maxDepth: number): VDOMNode {
  switch (typeof node) {
    case "string":
      return node;
    case "object":
      return {
        tagName: node.tagName,
        attributes: node.attributes,
        children:
          maxDepth === 0
            ? [snipIndicator]
            : node.children.map((child) => snipAtDepth(child, maxDepth - 1)),
      };
    default:
      throw new Error(`Unexpected node type: ${typeof node}`);
  }
}

export function getDepth(node: VDOMNode): number {
  switch (typeof node) {
    case "string":
      return 1;
    case "object":
      return 1 + Math.max(0, ...node.children.map(getDepth));
    default:
      throw new Error(`Unexpected node type: ${typeof node}`);
  }
}

function updateNodeAtPath(
  path: NodePath,
  updateFn: (node: VDOMNode) => VDOMNode,
  node: VDOMNode
): VDOMNode {
  if (typeof node === "string") {
    throw new Error("Invalid path to node: node is a string");
  }
  if (path.length === 0) {
    return updateFn(node);
  } else {
    const [updateIndex, ...rest] = path;
    if (updateIndex >= node.children.length) {
      throw new Error("Invalid path to node: index out of bounds");
    }
    return {
      ...node,
      children: node.children.map((child, childIndex) =>
        childIndex === updateIndex
          ? updateNodeAtPath(rest, updateFn, child)
          : child
      ),
    };
  }
}

export function widestNode(node: VDOMNode): {
  breadth: number;
  path: NodePath;
} {
  if (typeof node === "string") {
    return { breadth: 0, path: [] };
  }
  return node.children
    .map((child, index) => {
      const widestChild = widestNode(child);
      return {
        ...widestChild,
        path: [index, ...widestChild.path],
      };
    })
    .reduce((a, b) => (a.breadth > b.breadth ? a : b), {
      breadth: node.children.length,
      path: [],
    });
}

function snipChildren(node: VDOMNode) {
  if (typeof node === "string") {
    return node;
  }
  return {
    ...node,
    children: [
      ...node.children.slice(0, (node.children.length / 2) | 0),
      snipIndicator,
    ],
  };
}

export function snipWidestNode(node: VDOMNode) {
  const widest = widestNode(node);
  return updateNodeAtPath(widest.path, snipChildren, node);
}

export function widestNodeAtDepth(
  node: VDOMNode,
  depth: number
): { breadth: number; path: NodePath } {
  if (typeof node === "string") {
    return { breadth: 0, path: [] };
  } else if (depth === 0) {
    return { breadth: node.children.length, path: [] };
  } else {
    const widestChild = node.children
      .map((child, index) => {
        const widestWithinChild = widestNodeAtDepth(child, depth - 1);
        return {
          breadth: widestWithinChild.breadth,
          path: [index, ...widestWithinChild.path],
        };
      })
      .reduce(
        (a, b) =>
          // The widest child wins.
          a.breadth > b.breadth
            ? a
            : a.breadth < b.breadth
            ? b
            : // In case of a tie, the deepest path wins.
            a.path.length > b.path.length
            ? a
            : b,
        {
          breadth: 0,
          path: [],
        }
      );
    return widestChild;
  }
}

export function snipBreadthAtDepth(node: VDOMNode, depth: number): VDOMNode {
  if (typeof node === "string") {
    return node;
  }
  const widest = widestNodeAtDepth(node, depth);
  return updateNodeAtPath(widest.path, snipChildren, node);
}
