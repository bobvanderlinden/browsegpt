import type { Storage } from ".";

export class ChromeStorage implements Storage {
  constructor(private readonly prefix: string = "") {
    this.prefix = prefix;
  }

  getLocalStorageKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get(key: string): Promise<string | null> {
    const storageKey = this.getLocalStorageKey(key);
    const result = await chrome.storage.local.get(storageKey);
    console.log(storageKey, result);
    return result[storageKey] ?? null;
  }

  async set(key: string, value: string | null): Promise<void> {
    if (value === null) {
      chrome.storage.local.remove(this.getLocalStorageKey(key));
    } else {
      chrome.storage.local.set({
        [this.getLocalStorageKey(key)]: value,
      });
    }
  }

  async clear(): Promise<void> {
    chrome.storage.local.clear();
  }
}

export default ChromeStorage;
