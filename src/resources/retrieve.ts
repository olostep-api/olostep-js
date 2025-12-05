import {OlostepTransport} from '../http/transport.js';
import {Format, RetrieveRequest} from '../types.js';
import {OlostepResource} from './base.js';
import {ScrapeResult} from '../client_state/ScrapeResult.js';

export class RetrieveNamespace extends OlostepResource {
  constructor(transport: OlostepTransport) {
    super(transport);
  }

  async get(input: string | RetrieveRequest, formats?: Format | Format[]) {
    const payload: RetrieveRequest =
      typeof input === 'string'
        ? {retrieveId: input, formats}
        : {
            ...input,
            formats: input.formats ?? formats
          };

    const {data} = await this.transport.request({
      method: 'GET',
      path: '/retrieve',
      query: {
        retrieve_id: payload.retrieveId,
        ...(payload.formats
          ? {formats: Array.isArray(payload.formats) ? payload.formats : [payload.formats]}
          : {})
      }
    });
    return new ScrapeResult(data as Record<string, unknown>);
  }

  // Shorthand callable
  public async call(...args: Parameters<RetrieveNamespace['get']>) {
    return this.get(...args);
  }
}

