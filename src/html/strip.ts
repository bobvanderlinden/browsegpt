import { VDOMAttributes, VDOMElement, VDOMNode } from "./vdom";

const irrelevantContentTagNames = new Set([
  "script",
  "noscript",
  "style",
  "link",
]);

const relevantTagNames = new Set([
  // Document related.
  "main",
  "section",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "footer",
  "nav",
  "caption",
  "a",

  // List related.
  "ul",
  "ol",
  "li",

  // Table related.
  "table",
  "tr",
  "td",
  "th",
  "tbody",
  "thead",
  "tfoot",

  // Form related.
  "form",
  "button",
  "details",
  "input",
  "label",
  "select",
  "textarea",
  "title",
  // "img",

  // HTML related.
  "html",
  "head",
  "body",
]);

const relevantAttributes = new Set([
  // Attributes that are important for content and accessiblity, but not for a graphical representation.
  "id",
  "aria-role",
  "aria-label",
  "value",
  "name",
  "type",
  "placeholder",
  "href",
  "src",
  "alt",
  "title",
  "for",
  "rel",
  "target",
  "tabindex",
]);

function isRelevantAttribute(name: string, value: string) {
  return !value.startsWith("data:") && relevantAttributes.has(name);
}

function stripAttributes(attributes: VDOMAttributes) {
  return Object.fromEntries(
    Object.entries(attributes).filter(([name, value]) =>
      isRelevantAttribute(name, value)
    )
  );
}

function stripElement(element: VDOMElement): VDOMNode[] {
  const { tagName, attributes } = element;
  // Skip irrelevant content.
  if (irrelevantContentTagNames.has(tagName)) {
    return [];
  }

  if (attributes.hidden === "true") {
    return [];
  }

  if (attributes.type === "hidden") {
    return [];
  }

  if (attributes["aria-hidden"] === "true") {
    return [];
  }

  if (attributes["aria-disabled"] === "true") {
    return [];
  }

  if (attributes.disabled) {
    return [];
  }

  const children = stripWhitespace(
    mergeTextNodes(element.children.flatMap(stripNode))
  );

  // Omit tags that are irrelevant, but keep their content.
  if (!relevantTagNames.has(tagName)) {
    return children;
  }

  // Keep tags that are relevant and their content.
  return [
    {
      tagName,
      attributes: stripAttributes(element.attributes),
      children,
    },
  ];
}

function mergeTextNodes(nodes: VDOMNode[]): VDOMNode[] {
  const result: VDOMNode[] = [];
  let text = "";
  for (const node of nodes) {
    if (typeof node === "string") {
      text += node;
    } else {
      if (text) {
        result.push(text);
        text = "";
      }
      result.push(node);
    }
  }
  if (text) {
    result.push(text);
  }
  return result;
}

function isWhitespace(text: string): boolean {
  return /^\s+$/.test(text);
}

function stripWhitespace(nodes: VDOMNode[]): VDOMNode[] {
  return nodes.filter(
    (node) => typeof node !== "string" || !isWhitespace(node)
  );
}

function stripText(text: string): string[] {
  text = text.replace(/\s+/g, " ");
  return text ? [text] : [];
}

export function stripNode(node: VDOMNode): VDOMNode[] {
  switch (typeof node) {
    case "string":
      return stripText(node);
    case "object":
      return stripElement(node);
    default:
      throw new Error(`Unexpected node type: ${typeof node}`);
  }
}
