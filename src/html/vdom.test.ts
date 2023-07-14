import { html } from "../html";
import { map } from "../iterable";
import { parseVDOM, successiveMatches, tokenize } from "./vdom";

describe("successiveMatches", () => {
  test("matches multiple", () => {
    const regex = /a/g;
    expect(
      [...successiveMatches(regex, "aaa")].map((match) => match[0])
    ).toEqual(["a", "a", "a"]);
  });
  test("throws on non-successive match", () => {
    const regex = /a|bb/g;
    expect(() => [...successiveMatches(regex, "ab")]).toThrow();
  });
});

describe("tokenize", () => {
  test("self-closing tag", () => {
    expect([...tokenize(html`<br />`)]).toMatchInlineSnapshot(`
[
  {
    "attributes": {},
    "name": "br",
    "selfClosing": true,
    "type": "tag",
  },
]
`);
  });
  test("a simple tree", () => {
    expect([
      ...tokenize(html`<div id="first"><span>hello</span><br />hi</div>`),
    ]).toMatchInlineSnapshot(`
[
  {
    "attributes": {
      "id": ""first"",
    },
    "name": "div",
    "selfClosing": false,
    "type": "tag",
  },
  {
    "attributes": {},
    "name": "span",
    "selfClosing": false,
    "type": "tag",
  },
  {
    "text": "hello",
    "type": "text",
  },
  {
    "name": "span",
    "type": "closeTag",
  },
  {
    "attributes": {},
    "name": "br",
    "selfClosing": true,
    "type": "tag",
  },
  {
    "text": "hi",
    "type": "text",
  },
  {
    "name": "div",
    "type": "closeTag",
  },
]
`);
  });
});

describe("parseVDOM", () => {
  test("parses a simple tree", () => {
    const vdom = parseVDOM(
      html`<div id="first">hello<span>world</span><br />hi</div>`
    );
    expect(vdom).toMatchInlineSnapshot(`
{
  "attributes": {
    "id": ""first"",
  },
  "children": [
    "hello",
    {
      "attributes": {},
      "children": [
        "world",
      ],
      "tagName": "span",
    },
    {
      "attributes": {},
      "children": [],
      "tagName": "br",
    },
    "hi",
  ],
  "tagName": "div",
}
`);
  });

  test.each([
    "<",
    "<div",
    "<div>",
    "<div>hello",
    "<div>hello</",
    "<div>hello</div",
    "<div element/>",
    '<div element="/>',
    "<div element=''/>",
  ])(`throws unexpected end of input: %s`, (html) => {
    expect(() => [parseVDOM(html)]).toThrow();
  });
});
