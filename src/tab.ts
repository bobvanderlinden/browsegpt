import { Emitter } from "./emitter";

export class Tab {
  readonly onUpdated = new Emitter<(changeInfo: any) => void>();

  constructor(readonly tab: chrome.tabs.Tab) {}

  get id(): number {
    const id = this.tab.id;
    if (id === undefined) {
      throw new Error("Tab ID is undefined");
    }
    return id;
  }

  get url(): string | undefined {
    return this.tab.url;
  }

  async executeScript(options: { files: string[] } | { func: () => any }) {
    return await chrome.scripting.executeScript({
      target: { tabId: this.id },
      ...options,
    });
  }

  async sendMessage(message: any) {
    return await chrome.tabs.sendMessage(this.id, message);
  }

  async navigate(url) {
    await chrome.tabs.update(this.id, { url });
    await this.waitForCompleted();
  }

  waitForCompleted() {
    return new Promise((resolve) => {
      if (this.tab.status === "complete") {
        return resolve(undefined);
      }
      chrome.tabs.onUpdated.addListener(function listener(
        tabId,
        changeInfo,
        tab
      ) {
        if (tabId === this.id && changeInfo.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve(undefined);
        }
      });
    });
  }

  async inject() {
    await this.executeScript({
      files: ["content.js"],
    });
  }
}
