export type Primitive = string | number | boolean | null | undefined;

export enum Format {
  HTML = 'html',
  MARKDOWN = 'markdown',
  JSON = 'json',
  TEXT = 'text'
}

export enum Country {
  US = 'us',
  DE = 'de',
  FR = 'fr',
  GB = 'gb',
  SG = 'sg'
}

export interface ParserRef {
  id: string;
  version?: string;
}

export interface ScreenSize {
  screenType?: string;
  screenWidth?: number;
  screenHeight?: number;
}

export interface LLMExtractOptions {
  schema?: Record<string, unknown> | string;
  prompt?: string;
}

export interface LinksOnPageOptions {
  absoluteLinks?: boolean;
  queryToOrderLinksBy?: string;
  includeLinks?: string[];
  excludeLinks?: string[];
}

export interface WaitAction {
  type: 'wait';
  milliseconds: number;
}

export interface FillInputAction {
  type: 'fill_input';
  selector: string;
  value: Primitive;
}

export interface ClickAction {
  type: 'click';
  selector?: string;
  text?: string;
  button?: 'left' | 'right' | 'middle';
}

export interface ScrollAction {
  type: 'scroll';
  distance?: number;
  selector?: string;
}

export type Action = WaitAction | FillInputAction | ClickAction | ScrollAction;

export interface ScrapeRequest {
  url: string;
  formats?: Format | Format[] | string | string[];
  country?: Country | string;
  waitBeforeScraping?: number;
  removeCssSelectors?: string | string[];
  actions?: Action | Action[];
  transformer?: string;
  removeImages?: boolean;
  removeClassNames?: string[];
  parser?: ParserRef | string;
  parserId?: string;
  llmExtract?: LLMExtractOptions;
  linksOnPage?: LinksOnPageOptions;
  screenSize?: ScreenSize;
  metadata?: Record<string, Primitive>;
}

export interface BatchItem {
  url: string;
  customId: string; // Required by API
}

export interface BatchRequestOptions {
  country?: Country | string;
  parser?: ParserRef | string;
  parserId?: string;
  linksOnPage?: LinksOnPageOptions;
}

export interface CrawlRequest {
  url?: string;
  startUrl?: string;
  maxPages?: number;
  maxDepth?: number;
  includeUrls?: string | string[];
  excludeUrls?: string | string[];
  includeExternal?: boolean;
  includeSubdomain?: boolean;
  searchQuery?: string;
  topN?: number;
  webhookUrl?: string;
}

export interface MapRequest {
  url: string;
  searchQuery?: string;
  topN?: number;
  includeSubdomain?: boolean;
  includeUrls?: string | string[];
  excludeUrls?: string | string[];
}

export interface RetrieveRequest {
  retrieveId: string;
  formats?: Format | Format[];
}

export type RequestPayload =
  | ScrapeRequest
  | BatchItem[]
  | CrawlRequest
  | MapRequest
  | RetrieveRequest;

export interface PaginatedIteratorConfig<T> {
  batchSize?: number;
  waitForCompletion?: boolean;
  fetchPage: (cursor?: string) => Promise<{ items: T[]; nextCursor?: string }>;
}

