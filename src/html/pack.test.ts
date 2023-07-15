import { pack } from "./pack";
import { stringifyVDOM } from "./vdom";
import { parseVDOM } from "./parse";

describe("pack", () => {
  test("packs a deep tree", () => {
    expect(
      stringifyVDOM(
        pack({
          getWeight(vdom) {
            return stringifyVDOM(vdom).length;
          },
          maxWeight: `<div>1<p>2<span>[...]</span></p></div>`.length,
          root: parseVDOM(`<div>1<p>2<span>3<b>4</b></span></p></div>`),
        })
      )
    ).toMatchInlineSnapshot(`"<div>1<p>2<span>[...]</span></p></div>"`);
  });
  test("packs a wide tree", () => {
    expect(
      stringifyVDOM(
        pack({
          getWeight(vdom) {
            return stringifyVDOM(vdom).length;
          },
          maxWeight: `<div><p>1</p><p>2</p>[...]</div>`.length,
          root: parseVDOM(
            `<div><p>1</p><p>2</p><p>3</p><p>4</p><p>5</p></div>`
          ),
        })
      )
    ).toMatchInlineSnapshot(`"<div><p>1</p><p>2</p>[...]</div>"`);
  });
});
