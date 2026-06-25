/**
 * Contract-level tests for BatchNamespace.getScrapedStats().
 *
 * Validates response shape and optional param handling via a stubbed transport.
 * No live API calls.
 */

import {BatchNamespace, ScrapedStatsResponse} from '../src/resources/batch.js';
import {OlostepTransport, HttpRequest} from '../src/http/transport.js';

const FIXTURE: ScrapedStatsResponse = {
  object: 'batch.scraped_stats',
  window: 12,
  start_time: 1750800000000,
  end_time: 1750843200000,
  start_time_iso: '2025-06-25T00:00:00.000Z',
  end_time_iso: '2025-06-25T12:00:00.000Z',
  parser: null,
  batches: 5,
  items: 2500,
  scraped_items: 2375,
  scraped_pct: 95.0,
};

describe('ScrapedStatsResponse shape', () => {
  it('has all required fields', () => {
    expect(FIXTURE.object).toBe('batch.scraped_stats');
    expect(typeof FIXTURE.window).toBe('number');
    expect(typeof FIXTURE.start_time).toBe('number');
    expect(typeof FIXTURE.end_time).toBe('number');
    expect(typeof FIXTURE.start_time_iso).toBe('string');
    expect(typeof FIXTURE.end_time_iso).toBe('string');
    expect(typeof FIXTURE.batches).toBe('number');
    expect(typeof FIXTURE.items).toBe('number');
    expect(typeof FIXTURE.scraped_items).toBe('number');
    expect(typeof FIXTURE.scraped_pct).toBe('number');
  });

  it('parser field is nullable', () => {
    expect(FIXTURE.parser).toBeNull();
    const withParser: ScrapedStatsResponse = {...FIXTURE, parser: 'amazon-product'};
    expect(withParser.parser).toBe('amazon-product');
  });

  it('scraped_pct is within 0-100', () => {
    expect(FIXTURE.scraped_pct).toBeGreaterThanOrEqual(0);
    expect(FIXTURE.scraped_pct).toBeLessThanOrEqual(100);
  });

  it('scraped_items does not exceed items', () => {
    expect(FIXTURE.scraped_items).toBeLessThanOrEqual(FIXTURE.items);
  });

  it('end_time is greater than start_time', () => {
    expect(FIXTURE.end_time).toBeGreaterThan(FIXTURE.start_time);
  });
});

describe('BatchNamespace.getScrapedStats path', () => {
  let capturedRequest: unknown;

  const mockTransport: OlostepTransport = {
    request(opts: HttpRequest) {
      capturedRequest = opts;
      return Promise.resolve({data: FIXTURE as unknown, response: {} as Response});
    },
  } as unknown as OlostepTransport;

  beforeEach(() => {
    capturedRequest = undefined;
  });

  it('sends GET /batches/stats/scraped', async () => {
    const ns = new BatchNamespace(mockTransport);
    await ns.getScrapedStats();
    expect((capturedRequest as any).method).toBe('GET');
    expect((capturedRequest as any).path).toBe('/batches/stats/scraped');
  });

  it('sends empty query when no options provided', async () => {
    const ns = new BatchNamespace(mockTransport);
    await ns.getScrapedStats();
    expect((capturedRequest as any).query).toEqual({});
  });

  it('includes window in query when provided', async () => {
    const ns = new BatchNamespace(mockTransport);
    await ns.getScrapedStats({window: 24});
    expect((capturedRequest as any).query).toMatchObject({window: 24});
  });

  it('includes parser in query when provided', async () => {
    const ns = new BatchNamespace(mockTransport);
    await ns.getScrapedStats({parser: 'amazon-product'});
    expect((capturedRequest as any).query).toMatchObject({parser: 'amazon-product'});
  });

  it('includes both window and parser when both provided', async () => {
    const ns = new BatchNamespace(mockTransport);
    await ns.getScrapedStats({window: 48, parser: 'amazon-product'});
    expect((capturedRequest as any).query).toEqual({window: 48, parser: 'amazon-product'});
  });

  it('returns parsed ScrapedStatsResponse', async () => {
    const ns = new BatchNamespace(mockTransport);
    const result = await ns.getScrapedStats();
    expect(result.object).toBe('batch.scraped_stats');
    expect(result.scraped_pct).toBe(95.0);
  });
});
