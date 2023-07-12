import { Html, html } from "../html";
import { parseVDOM } from "./parse";
import { stripNode } from "./strip";
import { stringifyVDOM } from "./vdom";

describe("stripNode", () => {
  test.each([
    ["keeps text", html`hello`, html`hello`],
    ["omits <div>", html`<div>hello</div>`, html`hello`],
    [
      "omits recursively",
      html`<div>hello <span>world</span></div>`,
      html`hello world`,
    ],
    [
      "keeps <section>",
      html`<section>hello</section>`,
      html`<section>hello</section>`,
    ],
    [
      "keeps <section>, <h1>, <p> recursively",
      html`<section>
        <h1>Hello</h1>
        <p>hello <span>world</span></p>
      </section>`,
      new Html(`<section><h1>Hello</h1><p>hello world</p></section>`),
    ],
    [
      "omits <script> and its contents",
      html`<section>
        <script>
          console.log("hello");
        </script>
      </section>`,
      html`<section></section>`,
    ],
    ["omits class attributes", html`<p class="beautiful"></p>`, html`<p />`],
    [
      "keeps href attributes",
      html`<a href="page"></a>`,
      html`<a href="page" />`,
    ],
    [
      "encodes quotes in attributes",
      html`<a href='hello"world'></a>`,
      html(['<a href="hello&quot;world"></a>']),
    ],
  ])("%s", (_, input, expected) => {
    const inputNode = parseVDOM(input);
    const expectedNode = parseVDOM(expected);
    const strippedHtml = stripNode(inputNode)
      .map((node) => stringifyVDOM(node))
      .join("");
    const expectedHtml = stringifyVDOM(expectedNode);
    expect(strippedHtml).toEqual(expectedHtml);
  });
});
