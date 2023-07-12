type Result<TValue, TError> = { value: TValue } | { error: TError };

export function tryCatch<TValue, TError>(
  fn: () => TValue
): Result<TValue, TError> {
  try {
    return { value: fn() };
  } catch (e) {
    return { error: e };
  }
}

export function tryCatchAsync<TValue, TError>(
  fn: () => Promise<TValue>
): Promise<Result<TValue, TError>> {
  return fn().then(
    (value) => ({ value }),
    (error) => ({ error })
  );
}

export function map<TIn, TOut, TError>(
  fn: (value: TIn) => TOut,
  result: Result<TIn, TError>
): Result<TOut, TError> {
  if ("value" in result) {
    return { value: fn(result.value) };
  } else {
    return result;
  }
}

export function mapError<TIn, TErrorIn, TErrorOut>(
  fn: (error: TErrorIn) => TErrorOut,
  result: Result<TIn, TErrorIn>
): Result<TIn, TErrorOut> {
  if ("error" in result) {
    return { error: fn(result.error) };
  } else {
    return result;
  }
}
