export class FuelSystem {
  public capacity = 100;
  public level = 100;
  public pricePerLiterForStage = 10;

  reset(capacity = 100) {
    this.capacity = capacity;
    this.level = capacity;
  }

  /** Consume based on throttle & speed. */
  consume(throttleFactor: number, speedKmh: number, dt: number, consumeRate: number) {
    const usage = consumeRate * (0.3 + 0.7 * Math.max(throttleFactor, 0)) * (0.5 + speedKmh / 120);
    this.level = Math.max(0, this.level - usage * dt);
  }

  fillFull(): { litersAdded: number; cost: number } {
    const missing = this.capacity - this.level;
    const cost = missing * this.pricePerLiterForStage;
    this.level = this.capacity;
    return { litersAdded: missing, cost };
  }

  get percent(): number {
    return this.level / this.capacity;
  }

  isLow(): boolean { return this.percent < 0.3; }
  isCritical(): boolean { return this.percent < 0.15; }
  isEmpty(): boolean { return this.level <= 0.01; }
}
