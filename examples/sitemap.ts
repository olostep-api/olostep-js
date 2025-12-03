import {createClient, logJSON} from './helpers.js';

async function main() {
  const client = createClient();

  const sitemap = await client.sitemaps({
    url: 'https://example.com',
    topN: 50
  });

  logJSON('Sitemap result', {
    id: sitemap.id,
    urls_count: (sitemap as any).urls_count
  });

  // Demonstrate URL streaming
  console.log('\n=== Streaming URLs ===');
  let count = 0;
  for await (const url of sitemap.urls()) {
    console.log(`[${++count}] ${url}`);
  }
  console.log(`\nTotal URLs streamed: ${count}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

