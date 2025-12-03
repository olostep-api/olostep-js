import {OlostepTransport} from '../http/transport.js';
import {SitemapRequest} from '../types.js';
import {OlostepResource} from './base.js';
import {Sitemap} from '../client_state/Sitemap.js';

export interface SitemapResponse extends Record<string, unknown> {
  id: string;
  urlsCount: number;
  hasMore: boolean;
}

export class SitemapNamespace extends OlostepResource {
  constructor(transport: OlostepTransport) {
    super(transport);
  }

  private normalizePatterns(value?: string | string[]) {
    if (value === undefined) {
      return undefined;
    }
    return Array.isArray(value) ? value : [value];
  }

  async create(input: string | SitemapRequest) {
    const payload: SitemapRequest = typeof input === 'string' ? {url: input} : input;
    const body = {
      url: payload.url,
      search_query: payload.searchQuery,
      top_n: payload.topN,
      include_subdomain: payload.includeSubdomain,
      include_urls: this.normalizePatterns(payload.includeUrls),
      exclude_urls: this.normalizePatterns(payload.excludeUrls)
    };
    const {data} = await this.transport.request<SitemapResponse>({
      method: 'POST',
      path: '/maps',
      body
    });
    return new Sitemap(this.transport, data);
  }

  async info(mapId: string) {
    const {data} = await this.transport.request({
      method: 'GET',
      path: `/maps/${mapId}`
    });
    return data;
  }

  // Streamer/iterator not yet implemented
  async *urls(mapId: string) {
    throw new Error('Streaming sitemap URLs not implemented yet.');
  }

  // Shorthand callable
  public async call(...args: Parameters<SitemapNamespace['create']>) {
    return this.create(...args);
  }
}

