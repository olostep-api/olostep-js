# Olostep Node SDK (preview)

This package is the upcoming official Node.js SDK for the [Olostep web data platform](https://www.olostep.com).  
It mirrors the ergonomics of the Python SDK described in the repository root README: discoverable namespaces, async-first design, stateful return objects, and rich helpers for batches, crawls, sitemaps, and retrieval.

> **Status**: Work in progress. The scaffolding is in place, but the HTTP workflows and iterators are still TODOs.

## Getting started

```bash
npm install olostep-node
```

```ts
import {OlostepClient} from 'olostep-node';

const client = new OlostepClient({apiKey: process.env.OLOSTEP_API_KEY});

// Minimal scrape example
const result = await client.scrapes('https://example.com');
console.log(result.id, result.available);
```

### Feature highlights

- Async-first client with an opt-in sync facade (mirrors the Python SDK contract).
- Type-safe inputs using TypeScript enums and interfaces (Formats, Countries, Actions, etc.).
- Rich resource namespaces with both shorthand calls (`client.scrapes()`) and explicit methods (`client.scrapes.create()`).
- Shared transport layer with retries, timeouts, and JSON decoding.
- Comprehensive error hierarchy aligned with the Python SDK.

## Project structure

```
olostep-node/
├─ src/
│  ├─ client.ts              # Client + facade wiring
│  ├─ config.ts              # Option resolution & defaults
│  ├─ errors.ts              # Exception hierarchy
│  ├─ http/transport.ts      # Fetch-based HTTP transport with retries
│  ├─ resources/             # Namespaces (scrape, batch, crawl, sitemap, retrieve)
│  └─ types.ts               # Shared enums and DTOs
├─ package.json              # NPM metadata + scripts
├─ tsconfig*.json            # TypeScript build configs
└─ README.md                 # You are here
```

## Scripts

- `npm run build` – emit ESM to `dist/`.
- `npm run lint` – lint the TypeScript sources with ESLint.
- `npm run check:types` – type-check without emitting files.
- `npm run clean` – remove the build output.

## Examples

Sample scripts live in `examples/`. Copy `.env.example` to `.env` and set your `OLOSTEP_API_KEY`:

```bash
cp .env.example .env
# Edit .env and add your API key
```

Then run the examples:

```bash
npx tsx examples/scrape.ts
npx tsx examples/batch.ts
npx tsx examples/crawl.ts
npx tsx examples/sitemap.ts
npx tsx examples/retrieve.ts <retrieve_id>
```

They exercise each namespace using the current SDK surface and are a quick way to verify changes manually.

## Next steps

1. Flesh out the remaining TODOs (iterators, wait helpers, response typing).
2. Port validation and coercion logic from the Python SDK.
3. Add comprehensive tests (unit + integration).
4. Wire up CI and publish to npm.
