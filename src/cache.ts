import { JSONValue } from "./json";
import { Storage } from "./storage";
import hash from "object-hash";

export function cached<TFn extends (...args: any[]) => Promise<any>>(
  storage: Storage,
  fn: TFn
): TFn {
  return (async (...args: JSONValue[]): Promise<JSONValue> => {
    const key = hash(args);
    const cached = await storage.get(key);
    if (cached !== null) {
      return JSON.parse(cached);
    }
    const result = await fn(...args);
    await storage.set(key, JSON.stringify(result));
    return result;
  }) as TFn;
}
