import { onDomLoaded } from "../dom";
import { initChromeRuntimeReceiver } from "../message-proxy";
import { init as initMessages } from "./messages";
import * as messageHandlers from "./message-handlers";

initMessages();

onDomLoaded(async () => {
  const { openaiApiKey } = await chrome.storage.sync.get({ openaiApiKey: "" });
  if (!openaiApiKey) {
    document.documentElement.innerHTML =
      'Please set your OpenAI API key in <a href="options.html" target="_blank">options</a>';
    return;
  }

  document.querySelector("form").addEventListener("submit", handleSubmit);
  initChromeRuntimeReceiver(messageHandlers);

  const messages = await chrome.runtime.sendMessage({
    type: "getMessages",
  });
  messageHandlers.setMessages({ messages });
});

async function handleSubmit(e) {
  e.preventDefault();
  const input = document.querySelector("#input");
  const fieldset = document.querySelector("fieldset");
  fieldset.disabled = true;

  // Send message to background script
  const result = await chrome.runtime.sendMessage({
    type: "input",
    input: input.value,
  });
  input.value = "";

  fieldset.disabled = false;
}
