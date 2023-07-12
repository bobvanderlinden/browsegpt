import { onDomLoaded } from "../dom";
import { html } from "../html";
import { tryParseJson } from "../json";
import { initChromeRuntimeReceiver } from "../message-proxy";

let logElement: HTMLElement;

export function init() {
  onDomLoaded(() => {
    logElement = document.querySelector("#__browsegpt_log")!!;
  });
}

export function updateMessages(messages) {
  console.log("updateMessages", messages, logElement);
  logElement.innerHTML = renderMessages(messages).content;
  logElement.scrollTop = logElement.scrollHeight;
}

function renderMessages(messages) {
  return html`
    <ul>
      ${messages.map(renderMessage)}
    </ul>
  `;
}

function renderFunctionCall(call) {
  if (!call) {
    return "";
  }
  function parseArguments(str) {
    try {
      return Object.entries(JSON.parse(str)).map(
        ([key, value]) => `${key}=${JSON.stringify(value)}`
      );
    } catch (e) {
      return [str];
    }
  }

  return html`
    <span class="function_call">
      <span class="icon">🔧</span>
      <span class="name">${call.name}</span>
      ${parseArguments(call.arguments).map(
        (argument) => html`<span class="argument">${argument}</span>`
      )}
    </span>
  `;
}

function renderMessageContent(content) {
  content = tryParseJson(content) ?? content;
  if (typeof content === "string") {
    return html`<span class="content text">${content}</span>`;
  } else if (content == null) {
    return "";
  } else {
    const entries = Object.entries(content).map(
      ([key, value]) => html`${key}=${JSON.stringify(value)}`
    );
    return html`<span class="content">
      ${html`<details>
        <summary>${entries.at(0)}</summary>
        <ul>
          ${entries.map((entry) => html`<li>${entry}</li>`)}
        </ul>
      </details>`}
    </span>`;
  }
}

function renderMessage(message) {
  const roleEmojis = {
    system: "⚙️",
    assistant: "🤖",
    user: "👤",
    function: "🔧",
  };
  return html`
    <li>
      <span class="icon">${roleEmojis[message.role] ?? message.role}</span>
      <span class="right">
        ${renderMessageContent(message.content)}
        ${message.function_call && renderFunctionCall(message.function_call)}
      </span>
    </li>
  `;
}
