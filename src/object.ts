export function compactObject<T extends object>(obj: T): T {
  const result = {} as T;
  for (const key in obj) {
    if (obj[key] != null) {
      result[key] = obj[key];
    }
  }
  return result;
}
