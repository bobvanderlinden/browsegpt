import { readFile, writeFile, rm, mkdir } from "fs/promises";
import type { Storage } from ".";
import * as path from "path";

export class LocalFileStorage implements Storage {
  constructor(private readonly path: string = ".storage") {
    this.path = path;
  }

  getPath(key: string): string {
    return path.join(this.path, key);
  }

  async get(key: string): Promise<string | null> {
    try {
      return await readFile(this.getPath(key), "utf8");
    } catch (e) {
      if (e.code === "ENOENT") {
        return null;
      } else {
        throw e;
      }
    }
  }

  async set(key: string, value: string | null): Promise<void> {
    if (value === null) {
      try {
        await rm(this.getPath(key));
      } catch (e) {
        if (e.code !== "ENOENT") {
          throw e;
        }
      }
    } else {
      const attempt = async () => {
        await writeFile(this.getPath(key), value, { flag: "w" });
      };
      try {
        await attempt();
      } catch (e) {
        if (e.code === "ENOENT") {
          await mkdir(this.path, { recursive: true });
          await attempt();
        } else {
          throw e;
        }
      }
    }
  }

  async clear(): Promise<void> {
    await rm(this.path, { recursive: true });
  }
}

export default LocalFileStorage;
