import {OlostepTransport} from '../http/transport.js';

interface BatchHandleData extends Record<string, unknown> {
  id: string;
  total_urls?: number;
}

export class Batch {
  public readonly id: string;
  public readonly total_urls: number;
  private readonly transport: OlostepTransport;
  [key: string]: unknown;

  constructor(transport: OlostepTransport, data: BatchHandleData) {
    this.transport = transport;
    this.id = data.id;
    this.total_urls = (data.total_urls as number | undefined) ?? 0;
    Object.assign(this, data);
  }

  async info(): Promise<unknown> {
    const {data} = await this.transport.request({
      method: 'GET',
      path: `/batches/${this.id}`
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
        completed_urls?: number;
        total_urls?: number;
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
