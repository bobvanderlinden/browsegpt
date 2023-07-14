import { ChatCompletionRequestMessage } from "openai";
import { readVDOMFile } from "./html/parse";
import { stripNode } from "./html/strip";
import { maxDepth, snipAtDepth } from "./html/snip";
import { find, map, range } from "./iterable";
import { VDOMNode, stringifyVDOM, toVDOM } from "./html/vdom";
import { OpenAIModel, fitsContext } from "./openai";
import { LLM } from "./llm";
import { multiline } from "./multiline";

export async function analyze({
  llm,
  history,
  document,
}: {
  llm: LLM;
  history: ChatCompletionRequestMessage[];
  document: VDOMNode;
}) {
  const model = "gpt-3.5-turbo-16k-0613";
  const strippedDocument = stripNode(document);
  if (strippedDocument.length === 0) {
    throw new Error(`Stripped document is empty`);
  }
  const root =
    strippedDocument.length === 1
      ? strippedDocument[0]
      : strippedDocument.filter((node) => node.tagName === "html")[0];
  console.log({ root });
  const messages = getFittingMessages({
    model,
    history,
    htmlRoot: root,
  });
  if (messages === null) {
    throw new Error(
      `There was no way to fit the HTML analysis messages into the LLM context`
    );
  }
  const response = await llm({
    model,
    messages,
    temperature: 0,
  });

  return response.choices[0].message?.content;
}

function getFittingMessages({
  model,
  history,
  htmlRoot,
}: {
  model: OpenAIModel;
  history: ChatCompletionRequestMessage[];
  htmlRoot: VDOMNode;
}): ChatCompletionRequestMessage[] | null {
  const htmlDepth = maxDepth(htmlRoot);
  return find(
    (messages) => messages != null,
    map((depth) => {
      const html = stringifyVDOM(snipAtDepth(htmlRoot, depth));
      const messages = createMessages({ history, html });
      return fitsContext({ model, messages }) ? messages : null;
    }, range(htmlDepth, 0, -1))
  );
}

function createMessages({
  history,
  html,
}: {
  history: ChatCompletionRequestMessage[];
  html: string;
}): ChatCompletionRequestMessage[] {
  return [
    ...history,
    {
      role: "user",
      content: html,
    },
    {
      role: "system",
      content: multiline`
        The above HTML is content from a page.
        Extract selectors to elements that need to be interacted with in order to achieve the goal.
        For each selector tell why it is relevant.

        Examples of selectors:

        * \`#main form#createProduct button[name="submit"]\`: I need this to submit the form to create a product.
        * \`#content a[data-product-id="569"]\`: A link to go to the product page of the book "Harry Potter 1".
      `,
    },
  ];
}
