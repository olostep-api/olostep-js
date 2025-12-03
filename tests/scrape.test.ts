import {OlostepClient} from '../src/index.js';
import {Format} from '../src/types.js';

describe('Olostep SDK - Scrape Operations', () => {
  let client: OlostepClient;

  beforeAll(() => {
    if (!process.env.OLOSTEP_API_KEY) {
      throw new Error('OLOSTEP_API_KEY environment variable is required for tests');
    }
    client = new OlostepClient();
  });

  describe('Client Initialization', () => {
    test('should create client with environment variable', () => {
      const testClient = new OlostepClient();
      expect(testClient).toBeDefined();
    });

    test('should create client with API key passed directly', () => {
      const testClient = new OlostepClient({
        apiKey: process.env.OLOSTEP_API_KEY
      });
      expect(testClient).toBeDefined();
    });

    test('should throw error when no API key is provided', () => {
      const oldApiKey = process.env.OLOSTEP_API_KEY;
      delete process.env.OLOSTEP_API_KEY;
      
      expect(() => new OlostepClient()).toThrow('No API key provided');
      
      process.env.OLOSTEP_API_KEY = oldApiKey;
    });
  });

  describe('Scrape - Shorthand Syntax', () => {
    test('should scrape URL using client.scrapes()', async () => {
      const result = await client.scrapes('https://example.com');
      
      expect(result).toBeDefined();
      expect(result.id).toMatch(/^scrape_/);
      expect(result.retrieve_id).toBeDefined();
    }, 30000);

    test('should scrape with formats parameter', async () => {
      const result = await client.scrapes({
        url: 'https://example.com',
        formats: [Format.HTML, Format.MARKDOWN]
      });
      
      expect(result).toBeDefined();
      expect(result.html_content).toBeDefined();
      expect(result.markdown_content).toBeDefined();
    }, 30000);
  });

  describe('Scrape - Explicit Syntax', () => {
    test('should scrape URL using client.scrapes.create()', async () => {
      const result = await client.scrapes.create('https://example.com');
      
      expect(result).toBeDefined();
      expect(result.id).toMatch(/^scrape_/);
    }, 30000);

    test('should get scrape by ID using client.scrapes.get()', async () => {
      const created = await client.scrapes.create('https://example.com');
      const fetched = await client.scrapes.get(created.id as string);
      
      expect(fetched.id).toBe(created.id);
    }, 30000);
  });

  describe('Retrieve Operations', () => {
    test('should retrieve content by ID', async () => {
      const scrape = await client.scrapes({
        url: 'https://example.com',
        formats: [Format.HTML]
      });
      
      if (scrape.retrieve_id) {
        const retrieved = await client.retrieves(scrape.retrieve_id, Format.HTML);
        expect(retrieved).toBeDefined();
        expect(retrieved.html_content).toBeDefined();
      }
    }, 30000);

    test('should use client.retrieves.get() explicit syntax', async () => {
      const scrape = await client.scrapes('https://example.com');
      
      if (scrape.retrieve_id) {
        const retrieved = await client.retrieves.get(scrape.retrieve_id);
        expect(retrieved).toBeDefined();
      }
    }, 30000);
  });
});
