import { Html } from "../html";
import { multiline } from "../multiline";
import { compactObject } from "../object";
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

export function* successiveMatches(
  regex: RegExp,
  text: string
): Iterable<RegExpMatchArray> {
  let lastIndex = 0;
  for (const match of text.matchAll(regex)) {
    if (!match) {
      throw new Error(multiline`
        Unexpected input: ${text}
        Regex: ${regex}
      `);
    }
    if (match.index !== lastIndex) {
      throw new Error(
        multiline`
          Unexpected input: ${text.slice(lastIndex, match.index)}
          Input:     ${text}
          Indicator: ${"-".repeat(lastIndex)}^
        `
      );
    }
    yield match;
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex !== text.length) {
    throw new Error(
      multiline`
        Unexpected input: ${text.slice(lastIndex)}
        Input:     ${text}
        Indicator: ${"-".repeat(lastIndex)}^
      `
    );
  }
}

type Token =
  | {
      type: "tag";
      name: string;
      attributes: { [key: string]: string };
      selfClosing: boolean;
    }
  | { type: "closeTag"; name: string }
  | { type: "text"; text: string };

export function* tokenize(html: string | Html): Iterable<Token> {
  if (html instanceof Html) html = html.content;
  const regexes = {
    whitespace: /\s+/,
    tag: /<(?<tagName>[a-zA-Z0-9]+)(?<attributes>[^>]*?)?(?<selfClosing>\/)?>/,
    closeTag: /<\/(?<closeTagName>[a-zA-Z0-9]+)>/,
    text: /[^<]+/,
  };
  const tokenRegex = new RegExp(
    Object.entries(regexes)
      .map(([name, regex]) => `(?<${name}>${regex.source})`)
      .join("|"),
    "g"
  );
  for (const match of successiveMatches(tokenRegex, html)) {
    const groups = compactObject(match.groups!);
    const tokenType = Object.keys(groups).find((key) => key in regexes);
    if (!tokenType) {
      throw new Error(`Unexpected token: ${match[0]}`);
    }
    switch (tokenType) {
      case "whitespace":
        break;
      case "tag":
        const attributeRegex =
          /(?<attributeName>[a-zA-Z0-9]+)=(?<attributeValue>"[^"]*")|\s+/g;
        const attributes = groups.attributes
          ? Object.fromEntries(
              [...successiveMatches(attributeRegex, groups.attributes)]
                .filter(([_, name]) => name)
                .map(([_, name, value]) => [name, value])
            )
          : {};
        yield {
          type: "tag",
          name: groups.tagName,
          attributes,
          selfClosing: !!groups.selfClosing,
        };
        break;
      case "closeTag":
        yield {
          type: "closeTag",
          name: groups.closeTagName,
        };
        break;
      case "text":
        yield {
          type: "text",
          text: match[0],
        };
        break;
      default:
        throw new Error(`Unexpected token type: ${tokenType}`);
    }
  }
}

export function parseVDOM(html: string | Html): VDOMNode {
  const fragment = parseVDOMFragment(html);
  if (fragment.children.length !== 1) {
    throw new Error("Expected a single root element");
  }
  return fragment.children[0];
}

export function parseVDOMFragment(html: string | Html): VDOMElement {
  const tokens = [...tokenize(html)];
  const root = {
    tagName: "",
    attributes: {},
    children: [],
  };

  const elementStack: VDOMElement[] = [root];
  while (tokens.length) {
    const token = tokens.shift()!!;
    switch (token.type) {
      case "tag":
        const element: VDOMElement = {
          tagName: token.name,
          attributes: token.attributes,
          children: [],
        };
        elementStack[0].children.push(element);
        if (!token.selfClosing) {
          elementStack.unshift(element);
        }
        break;
      case "text":
        elementStack[0].children.push(token.text);
        break;
      case "closeTag":
        if (elementStack[0].tagName !== token.name) {
          throw new Error(multiline`
            Unexpected close tag: ${token.name}
              Expected: ${elementStack.at(-1)?.tagName}
              Actual: ${token.name}
          `);
        }
        elementStack.shift();
        break;
    }
  }
  if (elementStack.length > 1) {
    throw new Error(`Tag was not closed: ${elementStack.at(-1)?.tagName}`);
  }
  if (elementStack.length < 1) {
    throw new Error(`Root tag was unexpectedly closed`);
  }
  return root;
}
