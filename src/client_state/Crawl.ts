import {OlostepTransport} from '../http/transport.js';

interface CrawlHandleData extends Record<string, unknown> {
  id: string;
}

export class Crawl {
  public readonly id: string;
  private readonly transport: OlostepTransport;
  [key: string]: unknown;

  constructor(transport: OlostepTransport, data: CrawlHandleData) {
    this.transport = transport;
    this.id = data.id;
    Object.assign(this, data);
  }

  async info(): Promise<unknown> {
    const {data} = await this.transport.request({
      method: 'GET',
      path: `/crawls/${this.id}`
    });
    return data;
  }

  async waitTillDone(options?: {
    checkEveryNSecs?: number;
    timeoutSeconds?: number;
  }): Promise<void> {
    const checkEveryNSecs = options?.checkEveryNSecs ?? 10;
    const timeoutSeconds = options?.timeoutSeconds ?? 600;
    const startTime = Date.now();

    while (true) {
      const info = (await this.info()) as {
        status: string;
        current_depth?: number;
        pages_count?: number;
      };

      const waitElapsed = (Date.now() - startTime) / 1000;

      if (info.status === 'completed' || info.status === 'failed') {
        return;
      }

      if (waitElapsed >= timeoutSeconds) {
        throw new Error(
          `waitTillDone timed out after ${waitElapsed.toFixed(2)}s (timeout: ${timeoutSeconds}s)`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, checkEveryNSecs * 1000));
    }
  }
}

