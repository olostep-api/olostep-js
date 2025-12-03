import {OlostepTransport} from '../http/transport.js';
import {BatchItem as BatchItemType, BatchRequestOptions, Format, LinksOnPageOptions, ParserRef} from '../types.js';
import {OlostepResource} from './base.js';
import {Batch} from '../client_state/Batch.js';
import {BatchItem} from '../client_state/BatchItem.js';

export interface BatchResponse {
  id: string;
  total_urls: number;
  status?: string;
  object?: string;
  created?: number;
  [key: string]: unknown;
}
export interface BatchItemResponse {
  id: string;
  url: string;
  custom_id?: string;
  retrieve_id?: string;
  status: string;
  [key: string]: unknown;
}

interface BatchItemsPage {
  items?: BatchItemResponse[];
  cursor?: string | number | null;
  next_cursor?: string | number | null;
  has_more?: boolean;
}

const normalizeBatchInput = (input: string | string[] | BatchItemType[]): BatchItemType[] => {
  if (typeof input === 'string') {
    // Auto-generate customId from URL
    return [{url: input, customId: generateCustomId(input)}];
  }
  if (Array.isArray(input)) {
    if (input.length === 0) throw new Error('Batch input must not be empty');
    if (typeof input[0] === 'string') {
      // Auto-generate customIds from URLs
      return (input as string[]).map((url, index) => ({
        url,
        customId: generateCustomId(url, index)
      }));
    }
    return input as BatchItemType[];
  }
  throw new Error('Unsupported batch input');
};

const generateCustomId = (url: string, index?: number): string => {
  // Extract domain or use index-based ID
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '-');
    return index !== undefined ? `${domain}-${index}` : domain;
  } catch {
    return index !== undefined ? `url-${index}` : `url-${Date.now()}`;
  }
};
const toApiBatchItems = (items: BatchItemType[]) =>
  items.map((item) => ({url: item.url, custom_id: item.customId}));
const toParserPayload = (parser?: ParserRef | string, parserId?: string) => {
  const id = parserId ?? (typeof parser === 'string' ? parser : parser?.id);
  if (!id) return undefined;
  return {id, ...(typeof parser === 'object' && parser?.version ? {version: parser.version} : {})};
};
const toLinksOnPagePayload = (links?: LinksOnPageOptions) => {
  if (!links) return undefined;
  return {
    absolute_links: links.absoluteLinks,
    query_to_order_links_by: links.queryToOrderLinksBy,
    include_links: links.includeLinks,
    exclude_links: links.excludeLinks
  };
};

export class BatchNamespace extends OlostepResource {
  constructor(transport: OlostepTransport) {
    super(transport);
  }

  async start(input: string | string[] | BatchItemType[], options?: BatchRequestOptions) {
    const items = toApiBatchItems(normalizeBatchInput(input));
    const {data} = await this.transport.request<BatchResponse>({
      method: 'POST',
      path: '/batches',
      body: {
        items,
        country: options?.country,
        parser: toParserPayload(options?.parser, options?.parserId),
        links_on_page: toLinksOnPagePayload(options?.linksOnPage)
      }
    });
    return new Batch(this.transport, data);
  }

  async info(batchId: string) {
    const {data} = await this.transport.request({
      method: 'GET',
      path: `/batches/${batchId}`
    });
    return data;
  }

  async waitTillDone(batchId: string): Promise<void> {
    // Placeholder (future: poll info until done or fail)
    throw new Error('waitTillDone not implemented yet.');
  }

  async *items(
    batchId: string,
    options?: {batchSize?: number; status?: string; cursor?: string; waitForCompletion?: boolean}
  ): AsyncGenerator<BatchItem> {
    const limit = options?.batchSize ?? 50;
    let cursor: string | undefined = options?.cursor;

    while (true) {
      const {data} = await this.transport.request<BatchItemsPage>({
        method: 'GET',
        path: `/batches/${batchId}/items`,
        query: {
          limit,
          cursor,
          status: options?.status,
          wait_for_completion: options?.waitForCompletion
        }
      });

      const items = data?.items ?? [];
      if (!items.length) {
        break;
      }

      for (const item of items) {
        yield new BatchItem(this.transport, item);
      }

      const nextCursor = data?.next_cursor ?? data?.cursor;
      if (nextCursor === undefined || nextCursor === null) {
        break;
      }
      cursor = String(nextCursor);
    }
  }

  // Shorthand callable
  public async call(...args: Parameters<BatchNamespace['start']>) {
    return this.start(...args);
  }
}

