import { trimStrings, dedentStrings, multiline } from "./multiline";

describe(trimStrings, () => {
  it("outputs text without whitespace as is", () => {
    expect(trimStrings(["text"])).toEqual(["text"]);
  });
  it("outputs text without whitespace as is", () => {
    expect(trimStrings(["text", "another text"])).toEqual([
      "text",
      "another text",
    ]);
  });

  it("trims first and last string", () => {
    expect(
      trimStrings(["\n  first\n  ", "\n  second\n  ", "\nlast\n  \n"])
    ).toEqual(["  first\n  ", "\n  second\n  ", "\nlast"]);
  });
});

describe(dedentStrings, () => {
  it("without indentation outputs as-is", () => {
    expect(dedentStrings(["text"])).toEqual(["text"]);
  });
  it("without indentation outputs as-is", () => {
    expect(dedentStrings(["a", "b", "c"])).toEqual(["a", "b", "c"]);
  });
  it("outputs dedented lines over multiple strings", () => {
    expect(dedentStrings(["  a\n  b\n  ", "\n  c"])).toEqual(["a\nb\n", "\nc"]);
  });
  it("dedents multiple strings with each a single indented line", () => {
    expect(dedentStrings(["", "\n  ", "  \n  "])).toEqual(["", "\n", "  \n"]);
  });
});

describe(multiline, () => {
  it("outputs text without lines as is", () => {
    const result = multiline`text`;
    expect(result).toEqual("text");
  });

  it("outputs single line without surrounding whitespace", () => {
    const result = multiline`
    text
  `;
    expect(result).toEqual("text");
  });

  it("outputs multiple lines without indentation", () => {
    const result = multiline`
    text
    with
    indentation
  `;
    expect(result).toEqual("text\nwith\nindentation");
  });

  it("outputs variable", () => {
    const variable = "variable text";
    const result = multiline`
    first line
    ${variable}
    last line
  `;
    expect(result).toEqual("first line\nvariable text\nlast line");
  });

  it("outputs single line variable with correct indentation", () => {
    const variable = "variable text";
    const result = multiline`
    first line
      ${variable}
    last line
  `;
    expect(result).toEqual("first line\n  variable text\nlast line");
  });

  it("outputs multiple lines variable with correct indentation", () => {
    const variable = "variable\ntext\nwith\nmultiple\nlines";
    const result = multiline`
    first line
      ${variable}
    last line
  `;
    expect(result).toEqual(
      "first line\n  variable\n  text\n  with\n  multiple\n  lines\nlast line"
    );
  });

  it("outputs multiple lines from variable with indentation from prefix", () => {
    const variable = "variable\ntext\nwith\nmultiple\nlines";
    const result = multiline`
    first line
      variable: ${variable}
    last line
  `;
    expect(result).toEqual(
      "first line\n  variable: variable\n  text\n  with\n  multiple\n  lines\nlast line"
    );
  });
});
