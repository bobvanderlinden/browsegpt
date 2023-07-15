import { ChatCompletionRequestMessage } from "openai";
import { stripNode } from "./html/strip";
import { VDOMNode, stringifyVDOM } from "./html/vdom";
import { OpenAIModel, countTokens, maxTokensPerModel } from "./openai";
import { LLM } from "./llm";
import { multiline } from "./multiline";
import { pack } from "./html/pack";

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
  console.log({ strippedDocument });
  if (strippedDocument.length === 0) {
    throw new Error(`Stripped document is empty`);
  }
  const root =
    strippedDocument.length === 1
      ? strippedDocument[0]
      : strippedDocument.filter((node) => node.tagName === "html")[0];
  const messages = getFittingMessages({
    model,
    history,
    htmlRoot: root,
  });
  console.log({ messages });
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

  console.log({ response: response.choices[0].message?.content });

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
  const packedVdom = pack({
    root: htmlRoot,
    getWeight(vdom) {
      return countTokens({
        model,
        messages: createMessages({ history, vdom }),
      });
    },
    maxWeight: maxTokensPerModel[model],
  });
  return packedVdom ? createMessages({ history, vdom: packedVdom }) : null;
}

function createMessages({
  history,
  vdom,
}: {
  history: ChatCompletionRequestMessage[];
  vdom: VDOMNode;
}): ChatCompletionRequestMessage[] {
  const html = stringifyVDOM(vdom);
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
        For each selector tell in a few words why it is relevant.
        Escape identifiers with \\ where needed.

        Examples of selectors:

        * \`#main form#createProduct button[name="submit"]\`: I need this to submit the form to create a product.
        * \`#content a[data-product-id="569"]\`: A link to go to the product page of the book "Harry Potter 1".
        * \`#searchPage-input\`: An input field to search the website.
      `,
    },
  ];
}
