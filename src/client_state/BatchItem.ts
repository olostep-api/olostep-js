import {OlostepTransport} from '../http/transport.js';
import {Format} from '../types.js';

export class BatchItem {
  public readonly url: string;
  public readonly retrieve_id?: string;
  public readonly custom_id?: string;
  private readonly transport: OlostepTransport;

  constructor(transport: OlostepTransport, item: Record<string, unknown>) {
    this.transport = transport;
    Object.assign(this, item);
    this.url = (item.url as string) ?? '';
    this.retrieve_id = item.retrieve_id as string | undefined;
    this.custom_id = item.custom_id as string | undefined;
  }

  async retrieve(formats?: Format | Format[]): Promise<unknown> {
    if (!this.retrieve_id) {
      throw new Error('Batch item does not have a retrieve_id yet.');
    }

    const payload = {
      retrieve_id: this.retrieve_id,
      formats: formats && !Array.isArray(formats) ? [formats] : formats
    };
    const {data} = await this.transport.request({
      method: 'POST',
      path: '/retrieve',
      body: payload
    });
    return data;
  }
}
