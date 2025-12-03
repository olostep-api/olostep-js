# Olostep Node SDK Tests

This directory contains comprehensive tests for the Olostep Node.js SDK using Jest.

## Setup

1. Install Jest dependencies:
```bash
pnpm add -D jest @types/jest ts-jest
# or
npm install --save-dev jest @types/jest ts-jest
```

2. Set your API key:
```bash
export OLOSTEP_API_KEY="your_api_key_here"
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx jest tests/scrape.test.ts

# Run with coverage
npx jest --coverage
```

## Test Structure

### `scrape.test.ts`
Tests scraping operations including:
- Client initialization (env variable and direct API key)
- Shorthand syntax (`client.scrape()`)
- Explicit syntax (`client.scrape.create()`, `client.scrape.get()`)
- Content retrieval operations

### `batch.test.ts`
Tests batch processing including:
- Shorthand and explicit syntax
- Auto-generated customIds from URL strings
- Batch info retrieval
- `waitTillDone()` functionality with timeouts

### `sitemap-crawl.test.ts`
Tests sitemap and crawl operations including:
- Sitemap creation and URL streaming with `sitemap.urls()`
- Crawl creation and info retrieval
- Shorthand and explicit syntax for both

## Notes

- All tests require a valid `OLOSTEP_API_KEY` environment variable
- Tests make real API calls and will consume credits
- Timeout tests are set to reasonable values (30-90 seconds)
- Some tests (crawl, batch) may take longer as they wait for async operations

## Test Coverage

The tests cover:
- ✅ Client initialization (env var + direct API key)
- ✅ All shorthand syntax (`client.scrape()`, `client.batch()`, etc.)
- ✅ All explicit syntax (`client.scrape.create()`, `client.batch.start()`, etc.)
- ✅ Batch `waitTillDone()` with timeout handling
- ✅ Sitemap URL streaming with async iterators
- ✅ Error handling for missing API keys
- ✅ Auto-generation of customIds for batch operations
