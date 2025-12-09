import {OlostepClientOptions, resolveClientOptions} from './config.js';
import {OlostepTransport} from './http/transport.js';
import {BatchNamespace} from './resources/batch.js';
import {CrawlNamespace} from './resources/crawl.js';
import {RetrieveNamespace} from './resources/retrieve.js';
import {ScrapeNamespace} from './resources/scrape.js';
import {MapNamespace} from './resources/map.js';
import {BatchItem, BatchRequestOptions, CrawlRequest, Format, ScrapeRequest, MapRequest} from './types.js';

type NamespaceShorthand<
  TNamespace extends object,
  TMethod extends keyof TNamespace,
  TFn extends TNamespace[TMethod] extends (...args: any[]) => any ? TNamespace[TMethod] : never
> = ((...args: Parameters<TFn>) => ReturnType<TFn>) & TNamespace;

const attachShorthand = <
  TNamespace extends object,
  TMethod extends keyof TNamespace,
  TFn extends TNamespace[TMethod] extends (...args: any[]) => any ? TNamespace[TMethod] : never
>(
  namespace: TNamespace,
  method: TMethod
) => {
  const callable = namespace[method];

  if (typeof callable !== 'function') {
    throw new Error(`Cannot attach shorthand for non-function method "${String(method)}".`);
  }

  const shorthand = (...args: Parameters<TFn>) => {
    return (callable as (...args: Parameters<TFn>) => ReturnType<TFn>).apply(namespace, args);
  };

  // Copy all methods from the namespace (including prototype methods)
  const allKeys = [
    ...Object.getOwnPropertyNames(Object.getPrototypeOf(namespace)),
    ...Object.getOwnPropertyNames(namespace)
  ];
  
  for (const key of allKeys) {
    if (key !== 'constructor' && typeof (namespace as any)[key] === 'function') {
      (shorthand as any)[key] = (namespace as any)[key].bind(namespace);
    } else if (key !== 'constructor') {
      (shorthand as any)[key] = (namespace as any)[key];
    }
  }

  return shorthand as NamespaceShorthand<TNamespace, TMethod, TFn>;
};

export default class Olostep {
  private readonly transport: OlostepTransport;

  public readonly scrapes: NamespaceShorthand<ScrapeNamespace, 'create', ScrapeNamespace['create']>;
  public readonly batches: NamespaceShorthand<BatchNamespace, 'start', BatchNamespace['start']>;
  public readonly crawls: NamespaceShorthand<CrawlNamespace, 'start', CrawlNamespace['start']>;
  public readonly maps: NamespaceShorthand<MapNamespace, 'create', MapNamespace['create']>;
  public readonly retrieve: NamespaceShorthand<RetrieveNamespace, 'get', RetrieveNamespace['get']>;

  constructor(options?: OlostepClientOptions) {
    const resolved = resolveClientOptions(options);

    this.transport = new OlostepTransport(
      resolved.apiBaseUrl,
      resolved.apiKey,
      resolved.timeoutMs,
      resolved.retry,
      resolved.userAgent
    );

    this.scrapes = attachShorthand(new ScrapeNamespace(this.transport), 'create');
    this.batches = attachShorthand(new BatchNamespace(this.transport), 'start');
    this.crawls = attachShorthand(new CrawlNamespace(this.transport), 'start');
    this.maps = attachShorthand(new MapNamespace(this.transport), 'create');
    this.retrieve = attachShorthand(new RetrieveNamespace(this.transport), 'get');
  }

  async scrapeUrl(input: string | ScrapeRequest) {
    return this.scrapes(input);
  }

  async batchUrls(input: string | string[] | BatchItem[], options?: BatchRequestOptions) {
    return this.batches(input, options);
  }

  async crawlSite(input: string | CrawlRequest) {
    return this.crawls(input);
  }

  async mapSite(input: string | MapRequest) {
    return this.maps(input);
  }

  async retrieveContent(retrieveId: string, formats?: Format | Format[]) {
    return this.retrieve(retrieveId, formats);
  }
}
