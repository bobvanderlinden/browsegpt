import { assert } from "./assert";
import { JSONObject, JSONValue } from "./json";

export type ProxyFunctions = {
  [key: string]: (arg: any) => Promise<undefined | any>;
};

export function createSendProxy<TFns extends ProxyFunctions>(
  fns: TFns,
  sender: (message: JSONObject) => Promise<undefined | any>
): TFns {
  const handler: ProxyHandler<any> = {
    get(target, prop, receiver) {
      const fn = target[prop];
      if (fn === undefined) {
        return undefined;
      }
      if (typeof fn !== "function") {
        throw new Error("Non-function attributes are not supported.");
      }
      const wrapperFn = async (...args: any) => {
        if (args.length !== 1) {
          throw new Error(
            `Invalid number of arguments\n  Expected: 1\n  Actual: ${args.length}`
          );
        }
        const arg = args[0];
        if (typeof arg !== "object") {
          throw new Error("Argument must be an object.");
        }
        return await sender({
          type: prop,
          ...arg,
        });
      };

      // Copy over properties to the wrapper function.
      for (const key of Reflect.ownKeys(fn)) {
        if (!(key in wrapperFn)) {
          wrapperFn[key] = fn[key];
        }
      }
      return wrapperFn;
    },
    set(target, p, newValue, receiver) {
      throw new Error("Object is read-only.");
    },
  };
  return new Proxy(fns, handler);
}

class UnknownMessageTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnknownMessageTypeError";
  }
}

export function createReceiveProxy<TFns extends ProxyFunctions>(fns: TFns) {
  return function receive(message: JSONObject) {
    const { type, ...arg } = message;
    assert(typeof type === "string", "Message type must be a string.");
    assert(
      type in fns,
      () => new UnknownMessageTypeError(`Unknown message type: ${type}`)
    );
    const fn = fns[type as string];
    return fn(arg);
  };
}

export function initChromeRuntimeReceiver<TFns extends ProxyFunctions>(
  fns: TFns
) {
  const receive = createReceiveProxy(fns);
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("received message", message);
    try {
      receive(message)
        .then((result) => sendResponse(result))
        .catch((e) => {
          sendResponse("error: " + e.message);
        });
    } catch (e) {
      if (e instanceof UnknownMessageTypeError) {
        return false;
      }
      console.error("Error handling background message", message, e);
      sendResponse("error: " + e.message);
    }
    return true;
  });
}
