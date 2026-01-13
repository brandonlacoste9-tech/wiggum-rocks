class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, cb) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(cb);
    return () => this.off(event, cb);
  }

  off(event, cb) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).delete(cb);
  }

  async emit(event, payload) {
    if (!this.listeners.has(event)) return;
    const promises = Array.from(this.listeners.get(event)).map(cb =>
      Promise.resolve(cb(payload))
    );
    await Promise.all(promises);
  }
}

const bus = new EventBus();
export default bus;
