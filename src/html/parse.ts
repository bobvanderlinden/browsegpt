import { Html } from "../html";
import { multiline } from "../multiline";
import { compactObject } from "../object";
import { VDOMNode, VDOMElement } from "./vdom";

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
