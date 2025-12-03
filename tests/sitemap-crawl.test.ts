import {OlostepClient} from '../src/index.js';

describe('Olostep SDK - Sitemap & Crawl Operations', () => {
  let client: OlostepClient;

  beforeAll(() => {
    if (!process.env.OLOSTEP_API_KEY) {
      throw new Error('OLOSTEP_API_KEY environment variable is required for tests');
    }
    client = new OlostepClient();
  });

  describe('Sitemap Operations', () => {
    test('should create sitemap using client.sitemaps()', async () => {
      const sitemap = await client.sitemaps({
        url: 'https://example.com',
        topN: 10
      });
      
      expect(sitemap).toBeDefined();
      expect(sitemap.id).toMatch(/^map_/);
    }, 30000);

    test('should stream URLs using sitemap.urls()', async () => {
      const sitemap = await client.sitemaps('https://example.com');
      
      const urls: string[] = [];
      for await (const url of sitemap.urls()) {
        urls.push(url);
      }
      
      expect(urls.length).toBeGreaterThan(0);
      expect(urls[0]).toContain('example.com');
    }, 30000);

    test('should use client.sitemaps.create() explicit syntax', async () => {
      const sitemap = await client.sitemaps.create('https://example.com');
      
      expect(sitemap).toBeDefined();
      expect(sitemap.id).toMatch(/^map_/);
    }, 30000);
  });

  describe('Crawl Operations', () => {
    test('should create crawl using client.crawls()', async () => {
      const crawl = await client.crawls({
        url: 'https://example.com',
        maxPages: 3,
        maxDepth: 1
      });
      
      expect(crawl).toBeDefined();
      expect(crawl.id).toMatch(/^crawl_/);
      expect(crawl.start_url).toBe('https://example.com');
      expect(crawl.max_pages).toBe(3);
      expect(crawl.max_depth).toBe(1);
    }, 30000);

    test('should get crawl info using crawl.info()', async () => {
      const crawl = await client.crawls({
        url: 'https://example.com',
        maxPages: 3,
        maxDepth: 1
      });
      
      // Wait a bit for crawl to start
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const info = await crawl.info();
      expect(info).toBeDefined();
      expect((info as any).id).toBe(crawl.id);
      expect((info as any).status).toBeDefined();
      expect(['in_progress', 'completed', 'failed']).toContain((info as any).status);
    }, 35000);

    test('should use client.crawls.start() explicit syntax', async () => {
      const crawl = await client.crawls.start({
        url: 'https://example.com',
        maxPages: 3,
        maxDepth: 1
      });
      
      expect(crawl).toBeDefined();
      expect(crawl.id).toMatch(/^crawl_/);
    }, 35000);

    test('should use client.crawls.info() to get crawl info by ID', async () => {
      const crawl = await client.crawls({
        url: 'https://example.com',
        maxPages: 3,
        maxDepth: 1
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const info = await client.crawls.info(crawl.id);
      expect(info).toBeDefined();
      expect((info as any).id).toBe(crawl.id);
    }, 35000);

    test('should wait for crawl completion with waitTillDone', async () => {
      const crawl = await client.crawls({
        url: 'https://example.com',
        maxPages: 3,
        maxDepth: 1
      });
      
      // Should complete within reasonable time
      await expect(
        crawl.waitTillDone({checkEveryNSecs: 2, timeoutSeconds: 60})
      ).resolves.not.toThrow();
      
      const info = await crawl.info();
      expect((info as any).status).toBe('completed');
    }, 70000);
  });
});
