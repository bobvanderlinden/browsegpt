import { Tab } from "./tab";
import { Session } from "./session";
import { initChromeRuntimeReceiver } from "./message-proxy";
import { LLM } from "./llm";
import { cached } from "./cache";
import { chatCompletionRequest } from "./openai";
import ChromeStorage from "./storage/chrome-storage";

const sessions = {};
let llm: LLM;

async function getCurrentSession() {
  const [_tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  if (!_tab) {
    return null;
  }
  const tabId = _tab.id;
  if (!tabId) {
    return null;
  }
  return sessions[tabId] ?? (sessions[tabId] = new Session(llm, new Tab(_tab)));
}

const messageHandlers = {
  input: async ({ input }) => {
    const session = await getCurrentSession();
    if (input) {
      session.pushMessage({
        role: "user",
        content: input,
      });
    }
    return await session.run();
  },
  getMessages: async () => {
    const session = await getCurrentSession();
    return session.messages;
  },
};

async function init() {
  const storage = new ChromeStorage();
  llm = cached(storage, chatCompletionRequest);

  initChromeRuntimeReceiver(messageHandlers);

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!(tabId in sessions)) {
      return;
    }
    sessions[tabId].tab.onUpdated.emit(changeInfo);
  });
}

init();
