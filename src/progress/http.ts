import { PermanentError, type Progress, type ProgressApiClient, type ProgressEvent } from "./types.js";
import type { Topic } from "../curriculum.js";

/**
 * HTTP client for the Alexa+ Learning Coach's TV REST API (alexa-learning-coach/learning_coach/tvapi.py).
 * Contract (defined by us in that repo, not by Amazon):
 *   GET  {base}/api/progress/{child}         -> { progress: {topic: {level, correct, attempts, streak, updatedAt}}, ... }
 *   POST {base}/api/progress/{child}/events  <- { events: [{id, topic, correct, at}] }  -> same shape + {applied, duplicates, rejected}
 * Auth: `Authorization: Bearer <TV_API_TOKEN>`. `level` in events is not sent: the coach decides levels.
 * Verified only against our own coach (test/coach-integration.test.ts), not against Alexa+ or AWS.
 */
export class HttpProgressClient implements ProgressApiClient {
  private base: string;
  constructor(baseUrl: string, private token?: string, private fetchImpl: typeof fetch = (...a) => fetch(...a)) {
    this.base = baseUrl.replace(/\/+$/, "");
  }
  private headers() { return { "content-type": "application/json", ...(this.token ? { authorization: `Bearer ${this.token}` } : {}) }; }
  private url(id: string, tail = "") { return `${this.base}/api/progress/${encodeURIComponent(id)}${tail}`; }
  private async parse(r: Response, what: string): Promise<Progress> {
    if (!r.ok) {
      const msg = `${what} ${r.status}`;
      throw r.status === 400 || r.status === 413 ? new PermanentError(msg) : new Error(msg);
    }
    const j = (await r.json()) as { progress?: unknown };
    if (!j || typeof j.progress !== "object" || j.progress === null) throw new Error(`${what}: unexpected response`);
    return j.progress as Progress;
  }
  /** One retry on a network-level failure (e.g. a stale keep-alive socket). Safe: GET is read-only, POST events are id-idempotent. */
  private async req(url: string, init: RequestInit): Promise<Response> {
    try { return await this.fetchImpl(url, init); } catch { return await this.fetchImpl(url, init); }
  }
  async fetchProgress(id: string): Promise<Progress> {
    return this.parse(await this.req(this.url(id), { headers: this.headers() }), "fetchProgress");
  }
  async pushEvents(id: string, events: ProgressEvent[]): Promise<void> {
    const body = { events: events.map((e, i) => ({ id: e.id ?? `${e.at}-${i}`, topic: e.topic as Topic, correct: e.correct, at: e.at })) };
    await this.parse(await this.req(this.url(id, "/events"), { method: "POST", headers: this.headers(), body: JSON.stringify(body) }), "pushEvents");
  }
}
