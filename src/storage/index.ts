export interface Storage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string | null): Promise<void>;
  clear(): Promise<void>;
}
