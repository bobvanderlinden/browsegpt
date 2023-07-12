export function trimStrings(strings) {
  const result = [...strings];
  result[0] = result[0].replace(/^([\t ]*\r?\n)*/g, "");
  result[result.length - 1] = result[result.length - 1].replace(
    /(\r?\n[\t ]*)*$/g,
    ""
  );
  return result;
}

export function dedentStrings(strings) {
  let commonIndentation: string | undefined = undefined;
  for (const line of strings.join("").split("\n")) {
    const indentation = /^(?<indentation> *)/g.exec(line)?.groups?.indentation;
    if (commonIndentation === undefined || commonIndentation !== indentation) {
      commonIndentation = indentation;
    }
  }
  commonIndentation = commonIndentation || "";

  const commonIndentationRegex = new RegExp(`\n${commonIndentation}`, "g");

  const result = strings.map((string) => {
    return string.replace(commonIndentationRegex, "\n");
  });

  // The first line doesn't start with a new line.
  // Remove indentation from first string if it's there.
  if (result[0].startsWith(commonIndentation)) {
    result[0] = result[0].substring(commonIndentation.length);
  }

  return result;
}

function getIndentation(string) {
  return (
    /(?:^|\n)(?<indentation>[\t ]*)[^\n]*$/g.exec(string)?.groups
      ?.indentation || ""
  );
}

export function multiline(strings, ...args) {
  let result = "";

  strings = trimStrings(strings);
  strings = dedentStrings(strings);

  for (let i = 0; i < args.length; i++) {
    if (args[i] !== undefined) {
      const literalLines = strings[i].split("\n");
      const literalLinePrefix = literalLines.pop();

      const linePrefixIndentation = getIndentation(literalLinePrefix);
      const [firstDynamicLine, ...restDynamicLines] = args[i]
        .toString()
        .split("\n");
      result += [
        ...literalLines,
        `${literalLinePrefix}${firstDynamicLine}`,
        ...restDynamicLines.map((line) => `${linePrefixIndentation}${line}`),
      ].join("\n");
    } else {
      result += strings[i];
    }
  }
  result += strings[strings.length - 1];
  return result;
}
