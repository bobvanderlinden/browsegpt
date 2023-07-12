class MarkdownElement {
  constructor() {}

  toString() {
    throw new Error("Not implemented");
  }
}
class MarkdownDocument extends MarkdownElement {
  constructor(readonly elements: MarkdownElement[]) {
    super();
  }

  toString() {
    return this.elements.map((element) => element.toString()).join("");
  }
}
class InlineCode extends MarkdownElement {
  constructor(readonly text: string) {
    super();
  }

  toString() {
    return "`" + this.text + "`";
  }
}
class MultilineCode extends MarkdownElement {
  constructor(readonly text: string) {
    super();
  }

  toString() {
    return "```\n" + this.text + "\n```";
  }
}
class MarkdownText extends MarkdownElement {
  constructor(readonly text: string) {
    super();
  }

  toString() {
    return this.text;
  }
}
// Tagged string template
export function markdown(
  strings: TemplateStringsArray,
  ...variables: MarkdownElement[]
) {
  const result: MarkdownElement[] = [];
  for (let i = 0; i < strings.length; i++) {
    result.push(new MarkdownText(strings[i]));
    if (i < variables.length) {
      result.push(variables[i]);
    }
  }
  return new MarkdownDocument(result);
}
