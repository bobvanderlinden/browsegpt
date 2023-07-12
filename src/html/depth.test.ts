import { html } from "../html";
import { snipAtDepth } from "./depth";
import { parseVDOM } from "./parse";
import { stringifyVDOM } from "./vdom";

describe("snipAtDepth", () => {
  test("snips at depth 0", () => {
    const node = parseVDOM(html`<div>hello</div>`);
    expect(stringifyVDOM(snipAtDepth(node, 0))).toBe("<div>[...]</div>");
  });

  test("snips at depth 2", () => {
    expect(
      stringifyVDOM(
        snipAtDepth(
          parseVDOM(html`<section>
            <h1>Hello</h1>
            <p>hello <span>world</span></p>
          </section>`),
          2
        )
      )
    ).toBe(
      stringifyVDOM(
        parseVDOM(html`<section>
          <h1>Hello</h1>
          <p>hello <span>[...]</span></p>
        </section>`)
      )
    );
  });
});
