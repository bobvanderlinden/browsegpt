import { multiline } from "../multiline";
export type VDOMNode = string | VDOMElement;

export type VDOMAttributes = { [key: string]: string };

export interface VDOMElement {
  tagName: string;
  attributes: VDOMAttributes;
  children: VDOMNode[];
}

const Node =
  "Node" in globalThis
    ? globalThis.Node
    : {
        TEXT_NODE: 3,
        ELEMENT_NODE: 1,
        COMMENT_NODE: 8,
        CDATA_SECTION_NODE: 4,
        DOCUMENT_FRAGMENT_NODE: 11,
      };

export function toVDOM(node: Node): VDOMNode {
  switch (node.nodeType) {
    case Node.TEXT_NODE:
      return node.textContent ?? "";
    case Node.ELEMENT_NODE:
      const element = node as HTMLElement;
      return {
        tagName: element.tagName.toLowerCase(),
        attributes: Object.fromEntries(
          [...element.attributes].map((a) => [a.name, a.value])
        ),
        children: [...element.childNodes].map(toVDOM),
      };
    case Node.CDATA_SECTION_NODE:
      return node.textContent ?? "";
    case Node.DOCUMENT_FRAGMENT_NODE:
      return {
        tagName: "",
        attributes: {},
        children: [...node.childNodes].map(toVDOM),
      };
    case Node.COMMENT_NODE:
      return "";
    default:
      throw new Error(`Unexpected node type: ${node.nodeType}`);
  }
}

export function stringifyVDOM(
  node: VDOMNode,
  options: { pretty: boolean } = { pretty: false }
): string {
  switch (typeof node) {
    case "string":
      return node;
    case "object":
      return `<${[
        node.tagName,
        ...Object.entries(node.attributes).map(
          ([name, value]) => `${name}="${value}"`
        ),
      ].join(" ")}${
        !node.children.length
          ? `/>`
          : options.pretty
          ? multiline`
            >
              ${node.children
                .map((child) => stringifyVDOM(child, options))
                .join("")}
            </${node.tagName}>
          `
          : `>${node.children
              .map((child) => stringifyVDOM(child, options))
              .join("")}</${node.tagName}>`
      }`;
    default:
      throw new Error(`Unexpected node type: ${typeof node}`);
  }
}
