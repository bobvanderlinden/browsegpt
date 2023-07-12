import { createReceiveProxy, createSendProxy } from "./message-proxy";

describe("createReceiveProxy", () => {
  test("calls the correct function", () => {
    const fn = jest.fn();
    const receive = createReceiveProxy({ fn });
    receive({ type: "fn" });
    expect(fn).toHaveBeenCalled();
  });

  test("passes the correct arguments", () => {
    const fn = jest.fn();
    const receive = createReceiveProxy({ fn });
    receive({ type: "fn", arg: "hello" });
    expect(fn).toHaveBeenCalledWith({ arg: "hello" });
  });

  test("returns the result", async () => {
    const receive = createReceiveProxy({
      fn: async () => "hello",
    });
    const result = await receive({ type: "fn" });
    expect(result).toEqual("hello");
  });

  test("throws an error if type is not found", () => {
    const receive = createReceiveProxy({});
    expect(() => receive({ type: "fn" })).toThrow();
  });
});

describe("createSendProxy", () => {
  test("calls the sender", async () => {
    const sender = jest.fn();
    const proxy = createSendProxy({ async fn({}) {} }, sender);
    await proxy.fn({});
    expect(sender).toHaveBeenCalled();
  });

  test("passes the correct arguments", async () => {
    const sender = jest.fn();
    const proxy = createSendProxy({ async fn(arg) {} }, sender);
    await proxy.fn({ arg: "hello" });
    expect(sender).toHaveBeenCalledWith({ type: "fn", arg: "hello" });
  });

  test("returns the result", async () => {
    const proxy = createSendProxy({ async fn({}) {} }, async () => "hello");
    const result = await proxy.fn({});
    expect(result).toEqual("hello");
  });

  test("throws an error if type is not found", () => {
    const proxy: any = createSendProxy({}, async () => {});
    expect(() => proxy.fn({})).toThrow();
  });

  test("can iterate over functions", () => {
    const proxy: any = createSendProxy(
      {
        async fn1({}) {},
        async fn2({}) {},
      },
      async () => {}
    );
    expect(Object.keys(proxy)).toEqual(["fn1", "fn2"]);
  });
});
