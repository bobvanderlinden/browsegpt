import type { Storage } from ".";

console.log({ globalThis });

export class LocalStorage implements Storage {
  constructor(private readonly prefix: string = "") {
    this.prefix = prefix;
  }

  getLocalStorageKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get(key: string): Promise<string | null> {
    return global.localStorage.getItem(this.getLocalStorageKey(key));
  }

  async set(key: string, value: string | null): Promise<void> {
    if (value === null) {
      global.localStorage.removeItem(this.getLocalStorageKey(key));
    } else {
      global.localStorage.setItem(this.getLocalStorageKey(key), value);
    }
  }

  async clear(): Promise<void> {
    global.localStorage.clear();
  }
}

export default LocalStorage;
