import Olostep from '../src/index.js';

describe('Olostep SDK - Batch Operations', () => {
  let client: Olostep;

  beforeAll(() => {
    if (!process.env.OLOSTEP_API_KEY) {
      throw new Error('OLOSTEP_API_KEY environment variable is required for tests');
    }
    client = new Olostep();
  });

  describe('Batch - Shorthand Syntax', () => {
    test('should create batch using client.batches()', async () => {
      const batch = await client.batches([
        {url: 'https://example.com', customId: 'test-1'},
        {url: 'https://example.org', customId: 'test-2'}
      ]);
      
      expect(batch).toBeDefined();
      expect(batch.id).toMatch(/^batch_/);
      expect(batch.total_urls).toBe(2);
    }, 30000);

    test('should create batch with auto-generated customIds from strings', async () => {
      const batch = await client.batches([
        'https://example.com',
        'https://example.org'
      ]);
      
      expect(batch).toBeDefined();
      expect(batch.id).toMatch(/^batch_/);
      expect(batch.total_urls).toBe(2);
    }, 30000);
  });

  describe('Batch - Explicit Syntax', () => {
    test('should create batch using client.batches.start()', async () => {
      const batch = await client.batches.start([
        {url: 'https://example.com', customId: 'explicit-test-1'}
      ]);
      
      expect(batch).toBeDefined();
      expect(batch.id).toMatch(/^batch_/);
    }, 30000);

    test('should get batch info using batch.info()', async () => {
      const batch = await client.batches([
        {url: 'https://example.com', customId: 'info-test'}
      ]);
      
      const info = await batch.info();
      expect(info).toBeDefined();
      expect((info as any).id).toBe(batch.id);
      expect((info as any).status).toBeDefined();
    }, 30000);

    test('should use client.batches.info() to get batch info by ID', async () => {
      const batch = await client.batches([
        {url: 'https://example.com', customId: 'info-by-id-test'}
      ]);
      
      const info = await client.batches.info(batch.id);
      expect(info).toBeDefined();
      expect((info as any).id).toBe(batch.id);
    }, 30000);
  });

  describe('Batch - waitTillDone', () => {
    test('should wait for batch completion', async () => {
      const batch = await client.batches([
        {url: 'https://example.com', customId: 'wait-test'}
      ]);
      
      await expect(
        batch.waitTillDone({checkEveryNSecs: 3, timeoutSeconds: 60})
      ).resolves.not.toThrow();
      
      const info = await batch.info();
      expect((info as any).status).toBe('completed');
    }, 90000);

    test('should timeout if batch takes too long', async () => {
      const batch = await client.batches([
        {url: 'https://example.com', customId: 'timeout-test'}
      ]);
      
      await expect(
        batch.waitTillDone({checkEveryNSecs: 1, timeoutSeconds: 1})
      ).rejects.toThrow('timed out');
    }, 30000);
  });
});
