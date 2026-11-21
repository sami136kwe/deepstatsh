/** Small in-memory LRU for synthesized audio, bounded by total bytes. */
export class AudioCache {
  private map = new Map<string, Buffer>();
  private bytes = 0;
  constructor(private readonly maxBytes: number) {}

  get(key: string): Buffer | undefined {
    const value = this.map.get(key);
    if (value) {
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }

  set(key: string, value: Buffer): void {
    if (value.length > this.maxBytes) return;
    const previous = this.map.get(key);
    if (previous) this.bytes -= previous.length;
    this.map.delete(key);
    this.map.set(key, value);
    this.bytes += value.length;
    for (const [oldKey, oldValue] of this.map) {
      if (this.bytes <= this.maxBytes) break;
      this.map.delete(oldKey);
      this.bytes -= oldValue.length;
    }
  }

  get size(): number {
    return this.map.size;
  }
}
