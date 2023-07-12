export function* take<T>(count: number, iterable: Iterable<T>): Iterable<T> {
  let i = 0;
  for (const item of iterable) {
    if (i >= count) {
      return;
    }
    yield item;
    i++;
  }
}

export function first<T>(iterable: Iterable<T>): T | null {
  for (const item of iterable) {
    return item;
  }
  return null;
}

export function* iterate<T>(
  next: (item: T) => T | null,
  initial: T
): Iterable<T> {
  let currentItem: T = initial;
  while (true) {
    const nextItem = next(currentItem);
    if (!nextItem) {
      return;
    } else {
      currentItem = nextItem;
    }
    yield currentItem;
  }
}

export function* map<TInput, TOutput>(
  fn: (item: TInput) => TOutput,
  iterable: Iterable<TInput>
): Iterable<TOutput> {
  for (const item of iterable) {
    yield fn(item);
  }
}

export function* flatMap<TInput, TOutput>(
  fn: (item: TInput) => Iterable<TOutput>,
  iterable: Iterable<TInput>
): Iterable<TOutput> {
  for (const item of iterable) {
    yield* fn(item);
  }
}

export function* filter<T>(
  fn: (item: T) => boolean,
  iterable: Iterable<T>
): Iterable<T> {
  for (const item of iterable) {
    if (fn(item)) {
      yield item;
    }
  }
}

export function* mapFilter<TInput, TOutput>(
  fn: (item: TInput) => TOutput | null,
  iterable: Iterable<TInput>
): Iterable<TOutput> {
  for (const item of iterable) {
    const result = fn(item);
    if (result !== null) {
      yield result;
    }
  }
}

export function find<T>(
  fn: (item: T) => boolean,
  iterable: Iterable<T>
): T | null {
  for (const item of iterable) {
    if (fn(item)) {
      return item;
    }
  }
  return null;
}

export function* intersperse<T>(
  separator: T,
  iterable: Iterable<T>
): Iterable<T> {
  let first = true;
  for (const item of iterable) {
    if (!first) {
      yield separator;
    }
    yield item;
    first = false;
  }
}

export function join(separator: string, iterable: Iterable<string>): string {
  return concatStrings(intersperse(separator, iterable));
}

export function concatStrings(iterable: Iterable<string>): string {
  let result = "";
  for (const item of iterable) {
    result += item;
  }
  return result;
}

export function reduce<T, TResult>(
  fn: (accumulator: TResult, item: T) => TResult,
  initial: TResult,
  iterable: Iterable<T>
): TResult {
  let accumulator = initial;
  for (const item of iterable) {
    accumulator = fn(accumulator, item);
  }
  return accumulator;
}

export function* scan<T, TResult>(
  fn: (accumulator: TResult, item: T) => TResult,
  initial: TResult,
  iterable: Iterable<T>
): Iterable<TResult> {
  let accumulator = initial;
  for (const item of iterable) {
    accumulator = fn(accumulator, item);
    yield accumulator;
  }
}

export function* takeWhile<T>(
  fn: (item: T) => boolean,
  iterable: Iterable<T>
): Iterable<T> {
  for (const item of iterable) {
    if (!fn(item)) {
      return;
    }
    yield item;
  }
}

export function* count(): Iterable<number> {
  for (let i = 0; ; i++) {
    yield i;
  }
}

export function sum(iterable: Iterable<number>): number {
  let accumulator = 0;
  for (const item of iterable) {
    accumulator += item;
  }
  return accumulator;
}

export function* range(
  start: number,
  end: number,
  step: number = 1
): Iterable<number> {
  for (let i = start; i !== end; i += step) {
    yield i;
  }
}

export function* zip<T1, T2>(
  iterable1: Iterable<T1>,
  iterable2: Iterable<T2>
): Iterable<[T1, T2]> {
  const iterator1 = iterable1[Symbol.iterator]();
  const iterator2 = iterable2[Symbol.iterator]();
  while (true) {
    const result1 = iterator1.next();
    const result2 = iterator2.next();
    if (result1.done || result2.done) {
      return;
    }
    yield [result1.value, result2.value];
  }
}

export function* at(index: number, iterable: Iterable<any>): Iterable<any> {
  for (const item of iterable) {
    if (index === 0) {
      yield item;
    }
    index--;
  }
}
