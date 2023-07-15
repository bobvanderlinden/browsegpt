import { html } from "../html";
import { getDepth, snipAtDepth, snipBreadthAtDepth } from "./snip";
import { stringifyVDOM } from "./vdom";
import { parseVDOM } from "./parse";

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

describe("maxDepth", () => {
  test.each(
    [
      [`hello`, 1],
      [`<br />`, 1],
      [`<div>hello</div>`, 2],
      [`<div><p>hello</p><br /></div>`, 3],
    ].map(([input, depth]) => ({ input, depth }))
  )("returns $depth for $input", ({ input, depth }) => {
    expect(getDepth(parseVDOM(input))).toBe(depth);
  });
});

describe("snipBreadthAtDepth", () => {
  test("snips at depth 0", () => {
    expect(
      snipBreadthAtDepth(
        parseVDOM(`<div>1<br />2<br />3<br />4<br /></div>`),
        0
      )
    ).toEqual(parseVDOM(`<div>1<br />2<br />[...]</div>`));
  });
  test("snips largest node at depth 1", () => {
    expect(
      snipBreadthAtDepth(
        parseVDOM(`<div><p>1</p><p>2<br />3<br />4</p><p>5</p></div>`),
        1
      )
    ).toEqual(parseVDOM(`<div><p>1</p><p>2<br />[...]</p><p>5</p></div>`));
  });
});
