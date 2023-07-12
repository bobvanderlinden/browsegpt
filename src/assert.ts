type MessageConstructor = () => string | Error;
export function assert(
  condition: boolean,
  message?: string | MessageConstructor
): asserts condition {
  if (!condition) {
    const finalMessage: string | Error =
      message === undefined
        ? "Assertion failed"
        : message instanceof Function
        ? message()
        : message;
    if (finalMessage instanceof Error) {
      throw finalMessage;
    } else {
      throw new Error(finalMessage);
    }
  }
}
