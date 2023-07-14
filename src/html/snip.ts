import { flatMap } from "../iterable";
import { VDOMNode } from "./vdom";

const snipIndicator = "[...]";

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

export function maxDepth(node: VDOMNode): number {
  switch (typeof node) {
    case "string":
      return 0;
    case "object":
      return 1 + Math.max(...node.children.map(maxDepth));
    default:
      throw new Error(`Unexpected node type: ${typeof node}`);
  }
}
