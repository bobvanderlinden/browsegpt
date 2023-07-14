import { find, map, range } from "../iterable";
import { maxDepth, snipAtDepth } from "./snip";
import { VDOMNode } from "./vdom";

/**
 * Compresses the HTML tree to the smallest possible size that still fits.
 * @param fits A function that returns true if the given VDOM node fits.
 * @param root The root of the HTML tree to compress.
 */
export function pack({
  fits,
  root,
}: {
  fits: (vdom: VDOMNode) => boolean;
  root: VDOMNode;
}): VDOMNode | null {
  const htmlDepth = maxDepth(root);
  return find(
    (packedNode) => fits(packedNode),
    map((depth) => snipAtDepth(root, depth), range(htmlDepth, 0, -1))
  );
}
