import { multiline } from "./multiline";

export class Html {
  constructor(readonly content: string) {}
}
export function html(strings, ...args) {
  function stringifyHtml(value) {
    if (value === null || value === undefined) {
      return "";
    } else if (value instanceof Html) {
      return value.content;
    } else if (typeof value === "string") {
      return value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    } else if (Array.isArray(args)) {
      return value.map(stringifyHtml).join("");
    } else {
      return stringifyHtml(value.toString());
    }
  }

  return new Html(multiline(strings, ...args.map(stringifyHtml)));
}
