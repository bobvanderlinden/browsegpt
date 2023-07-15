import { getDepth, snipAtDepth, snipWidestNode } from "./snip";
import { VDOMNode, stringifyVDOM } from "./vdom";

/**
 * Removes parts of the HTML tree to the smallest possible size that still fits.
 * @param fits A function that returns true if the given VDOM node fits.
 * @param root The root of the HTML tree to compress.
 */
export function pack({
  getWeight,
  maxWeight,
  root,
}: {
  getWeight: (vdom: VDOMNode) => number;
  maxWeight: number;
  root: VDOMNode;
}): VDOMNode {
  let maxDepth = getDepth(root);
  let currentWeight: number;
  while ((currentWeight = getWeight(root)) > maxWeight) {
    let depthSnip = snipAtDepth(root, maxDepth);
    while (getWeight(depthSnip) >= currentWeight && maxDepth > 1) {
      maxDepth--;
      depthSnip = snipAtDepth(root, maxDepth);
    }

    const breadthSnip = snipWidestNode(root);

    const depthSnipWeight = getWeight(depthSnip);
    const breadthSnipWeight = getWeight(breadthSnip);
    if (
      currentWeight <= depthSnipWeight &&
      currentWeight <= breadthSnipWeight
    ) {
      // We were not able to make it smaller.
      break;
    } else if (depthSnipWeight < breadthSnipWeight) {
      root = depthSnip;
    } else if (depthSnipWeight > breadthSnipWeight) {
      root = breadthSnip;
    }
  }
  return root;
}
