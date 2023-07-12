import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
} from "openai";
import { multiline } from "./multiline";
import { map, sum } from "./iterable";
import { encodingForModel, TiktokenModel } from "js-tiktoken";
import { compactArray } from "./array";

async function fetchKeyFromEnvironment() {
  return globalThis?.process?.env?.OPENAI_API_KEY;
}

async function fetchKeyFromStorage() {
  const storageResults = await globalThis?.chrome?.storage?.sync?.get({
    openaiApiKey: "",
  });
  return storageResults?.openaiApiKey ? storageResults.openaiApiKey : undefined;
}

export async function chatCompletionRequest(
  body: CreateChatCompletionRequest,
  openaiApiKey?: string
): Promise<CreateChatCompletionResponse> {
  openaiApiKey =
    openaiApiKey ??
    (await fetchKeyFromEnvironment()) ??
    (await fetchKeyFromStorage());
  if (!openaiApiKey) {
    throw new Error(`No OpenAI API key provided`);
  }
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${openaiApiKey}`,
  };
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    headers,
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(multiline`
      OpenAI API responsed with status code ${response.status} ${response.statusText}
      ${text}
    `);
  }
  return await response.json();
}

const maxTokensPerModel = {
  "gpt-4": 8192,
  "gpt-4-0613": 8192,
  "gpt-4-32k": 32768,
  "gpt-4-32k-0613": 32768,
  "gpt-3.5-turbo": 4096,
  "gpt-3.5-turbo-16k": 16384,
  "gpt-3.5-turbo-0613": 4096,
  "gpt-3.5-turbo-16k-0613": 16384,
  "text-davinci-003": 4097,
  "text-davinci-002": 4097,
  "code-davinci-002": 8001,
};

export type OpenAIModel = TiktokenModel;

export function countTokens({
  model,
  messages,
}: {
  model: TiktokenModel;
  messages: ChatCompletionRequestMessage[];
}): number {
  const encoding = encodingForModel(model);

  function textTokens(text: string) {
    return encoding.encode(text).length;
  }

  return sum(
    map(
      (message) =>
        textTokens(
          compactArray([
            message.content,
            message.name ?? message.role,
            message.function_call?.name,
            message.function_call?.arguments,
          ]).join(" ")
        ),
      messages
    )
  );
}

export function fitsContext({
  model,
  messages,
}: {
  model: TiktokenModel;
  messages: ChatCompletionRequestMessage[];
}): boolean {
  return countTokens({ model, messages }) <= maxTokensPerModel[model];
}
