import type { Progress, ProgressApiClient, ProgressEvent } from "./types.js";

/**
 * HTTP adapter skeleton. Paths and auth are placeholders: TODO-verify against the Alexa+ Learning
 * Coach backend's actual API (not defined yet in this repo). Nothing here has been run against a server.
 */
export class HttpProgressClient implements ProgressApiClient {
  constructor(private baseUrl: string, private token?: string, private fetchImpl: typeof fetch = fetch) {}
  private headers() { return { "content-type": "application/json", ...(this.token ? { authorization: `Bearer ${this.token}` } : {}) }; }
  async fetchProgress(id: string): Promise<Progress> {
    const r = await this.fetchImpl(`${this.baseUrl}/learners/${encodeURIComponent(id)}/progress`, { headers: this.headers() }); // TODO-verify path
    if (!r.ok) throw new Error(`fetchProgress ${r.status}`);
    return (await r.json()) as Progress; // TODO-verify response shape
  }
  async pushEvents(id: string, events: ProgressEvent[]): Promise<void> {
    const r = await this.fetchImpl(`${this.baseUrl}/learners/${encodeURIComponent(id)}/events`, { method: "POST", headers: this.headers(), body: JSON.stringify({ events }) }); // TODO-verify
    if (!r.ok) throw new Error(`pushEvents ${r.status}`);
  }
}
