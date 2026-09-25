import type { Progress, ProgressApiClient, ProgressEvent } from "./types.js";
import { applyEvents } from "./sync.js";

/** In-memory stand-in for the coach's store (default). `failNext` simulates an offline TV. */
export class MockProgressClient implements ProgressApiClient {
  store = new Map<string, Progress>();
  failNext = 0;
  async fetchProgress(id: string): Promise<Progress> {
    if (this.failNext > 0) { this.failNext--; throw new Error("offline"); }
    return structuredClone(this.store.get(id) ?? {});
  }
  async pushEvents(id: string, events: ProgressEvent[]): Promise<void> {
    if (this.failNext > 0) { this.failNext--; throw new Error("offline"); }
    this.store.set(id, applyEvents(this.store.get(id) ?? {}, events));
  }
}
