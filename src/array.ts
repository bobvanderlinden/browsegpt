export function compactArray<T>(arr: T[]): T[] {
  return arr.filter((item) => item != null);
}
