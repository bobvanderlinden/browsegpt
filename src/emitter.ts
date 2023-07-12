type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any
  ? A
  : never;

export class Emitter<T extends Function> {
  private listeners = new Set<T>();

  add(callback: T) {
    this.listeners.add(callback);
  }

  delete(callback: T) {
    this.listeners.delete(callback);
  }

  emit(...args: ArgumentTypes<T>) {
    for (const listener of this.listeners) {
      listener(...args);
    }
  }
}
