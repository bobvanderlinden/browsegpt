import { ChatCompletionRequestMessage } from "openai";
import { Tab } from "./tab";
import { createSendProxy } from "./message-proxy";
import * as contentMessageHandlers from "./content/message-handlers";
import * as popupMessageHandlers from "./popup/message-handlers";
import { annotateMetadata, getMetadata } from "./metadata";
import { tryParseJson } from "./json";
import { analyze } from "./html-analyzer";
import { LLM } from "./llm";
import { tryCatchAsync } from "./fun";
import { multiline } from "./multiline";

export class Session {
  readonly contentInterface: typeof contentMessageHandlers;
  readonly popupInterface: typeof popupMessageHandlers;
  constructor(
    readonly llm: LLM,
    readonly tab: Tab,
    readonly messages: ChatCompletionRequestMessage[] = []
  ) {
    this.contentInterface = createSendProxy(
      contentMessageHandlers,
      async (message) => {
        await this.inject();
        return await this.tab.sendMessage(message);
      }
    );
    this.popupInterface = createSendProxy(
      popupMessageHandlers,
      async (message) => await chrome.runtime.sendMessage(message)
    );
    this.pushMessage({
      role: "system",
      content: multiline`
        Operate a browser of the user.
        The goal is to find the answer to a question the user will give you.

        If you get stuck, you can ask the user for help.

        Never use selectors that are not given to you by the system.
        Use 'analyzePage' to find selectors that help you achieve the goal.
      `,
    });

    tab.onUpdated.add(this.handleTabUpdated.bind(this));
  }

  async run() {
    console.group("run");
    try {
      await this.updateState();

      for (let i = 0; i < 20; i++) {
        const result = await this.step();
        if (result) {
          console.log("run result", result);
          return result;
        }
      }
    } catch (e) {
      console.error("failed!", e);
    } finally {
      console.groupEnd();
    }
  }

  async getState() {
    return await this.contentInterface.getState({});
  }

  async updateState() {
    const state = await this.getState();
    const pageState = JSON.stringify({ type: "pageState", ...state });
    if (pageState !== this.lastPageState) {
      this.lastPageState = pageState;
      this.pushMessage({
        role: "system",
        content: pageState,
      });
    }
  }

  async step() {
    const contentInterface = this.contentInterface;
    const sessionInterface = {
      navigate: annotateMetadata(
        {
          name: "navigate",
          description: "Navigate to a URL",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "The URL to navigate to",
              },
            },
            required: ["url"],
          },
        },
        async ({ url }) => {
          await this.tab.navigate(url);
        }
      ),
      analyzePage: annotateMetadata(
        {
          name: "analyzePage",
          description:
            "Analyze the page for useful elements. Returns the selectors of those elements.",
          parameters: {
            type: "object",
            properties: {},
          },
        },
        async ({}) => {
          console.log("Analyzing page...");
          const vdom = await this.contentInterface.getPageVDOM({});
          const result = await analyze({
            history: this.messages,
            llm: this.llm,
            document: vdom,
          });
          console.log("Analysis result", result);
          return result;
        }
      ),
    };

    const gptInterface = {
      ...contentInterface,
      ...sessionInterface,
    };

    const functions = Object.entries(gptInterface)
      .map(([name, fn]) => getMetadata(fn))
      .filter(Boolean);

    const request = {
      model: "gpt-4",
      messages: this.messages,
      functions,
      temperature: 0,
    };

    const chatCompletion = await this.llm(request);
    const message = chatCompletion.choices[0].message;
    if (message === undefined) {
      console.error("OpenAI API returned no message", chatCompletion);
      throw new Error("OpenAI API returned no message");
    }
    this.pushMessage(message);

    if (message?.function_call?.name) {
      const fn = gptInterface[message.function_call.name];
      if (!fn) {
        this.pushMessage({
          role: "function",
          name: message.function_call.name,
          content: `error: Function ${message.function_call.name} not found.`,
        });
        return;
      }
      const args = message.function_call.arguments
        ? [JSON.parse(message.function_call.arguments)]
        : [{}];

      const result = await tryCatchAsync<any, Error>(() => fn(...args));

      const functionResultContent =
        "error" in result
          ? `error: ${result.error.message}`
          : typeof result.value === "string"
          ? result.value
          : result.value === undefined || result.value === null
          ? "success"
          : JSON.stringify(result.value);

      this.pushMessage({
        role: "function",
        name: message.function_call.name,
        content: functionResultContent,
      });

      // Wait for any navigation that might have happened as a result of the function call.
      await this.tab.waitForCompleted();

      // Update the assistant about the state of the page.
      this.updateState();
    }
    return message.content;
  }

  async handleTabUpdated(changeInfo: chrome.tabs.TabChangeInfo) {
    let previousBrowserStateUpdated: any = null;
    const lastMessage = this.messages.at(-1);
    if (lastMessage?.role === "system" && lastMessage?.content) {
      const previousMessage = tryParseJson(lastMessage.content);
      if (
        previousMessage &&
        previousMessage.event === "browser state updated"
      ) {
        previousBrowserStateUpdated = previousMessage;
        this.messages.pop();
      }
    }

    this.messages.push({
      role: "system",
      content: JSON.stringify({
        event: "browser state updated",
        ...previousBrowserStateUpdated,
        ...changeInfo,
      }),
    });
  }

  pushMessage(message: ChatCompletionRequestMessage) {
    console.log("message", message);
    this.messages.push(message);
    this.popupInterface
      .setMessages({ messages: this.messages })
      .then()
      .catch(() => {});
  }

  async inject() {
    try {
      await this.tab.sendMessage({ type: "ping" });
    } catch (e) {
      await this.tab.executeScript({
        files: ["content.js"],
      });
    }
  }
}
