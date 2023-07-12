import { Html } from "../html";
import { VDOMNode, toVDOM } from "./vdom";
import { JSDOM } from "jsdom";
import { readFile } from "fs/promises";

export function parseVDOM(html: Html): VDOMNode {
  const fragment = JSDOM.fragment(html.content).getRootNode();
  if (fragment.childNodes.length !== 1) {
    throw new Error(`Expected a single element for ${html.content}`);
  }
  return toVDOM(fragment.childNodes[0]);
}

export function parseVDOMDocument(html: string): VDOMNode {
  const root = new JSDOM(html).window.document.documentElement;
  return toVDOM(root);
}

export async function readVDOMFile(path: string): Promise<VDOMNode> {
  const html = await readFile(path, "utf-8");
  return parseVDOMDocument(html);
}
