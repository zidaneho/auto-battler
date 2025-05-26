export class SafeArray<T> {
  private array: T[] = [];
  private addQueue: T[] = [];
  private removeQueue: Set<T> = new Set();


  get isEmpty(): boolean {
    return this.addQueue.length + this.array.length > 0;
  }

  add(element: T): void {
    this.addQueue.push(element);
  }

  remove(element: T): void {
    this.removeQueue.add(element);
  }

  forEach(fn: (element: T) => void): void {
    this._addQueued();
    this._removeQueued();
    for (const element of this.array) {
      if (this.removeQueue.has(element)) {
        continue;
      }
      fn(element);
    }
    this._removeQueued();
  }

  private _addQueued(): void {
    if (this.addQueue.length) {
      this.array.splice(this.array.length, 0, ...this.addQueue);
      this.addQueue = [];
    }
  }

  private _removeQueued(): void {
    if (this.removeQueue.size) {
      this.array = this.array.filter(element => !this.removeQueue.has(element));
      this.removeQueue.clear();
    }
  }

  get length(): number {
    return this.array.length + this.addQueue.length - this.removeQueue.size;
  }
}