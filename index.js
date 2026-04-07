const { crawl } = require('./crawler');

// Target websites to crawl
const TARGETS = [
  { url: 'https://cmlabs.co', label: 'cmlabs.co' },
  { url: 'https://sequence.day', label: 'sequence.day' },
  { url: 'https://tailwindcss.com', label: 'tailwindcss.com' },
];

async function crawlAll() {
  console.log('=== Web Crawler ===\n');
  const results = [];

  for (const target of TARGETS) {
    console.log(`\nTarget: ${target.label}`);
    console.log('-'.repeat(40));
    const result = await crawl(target.url);
    results.push(result);
  }

  console.log('\n=== Summary ===');
  results.forEach((r) => {
    const status = r.success ? '[OK]' : '[FAIL]';
    const detail = r.success
      ? `${r.filename} (${(r.size / 1024).toFixed(1)} KB)`
      : r.error;
    console.log(`${status} ${r.url} → ${detail}`);
  });

  return results;
}

function createServer() {
  const express = require('express');
  const app = express();
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({
      name: 'Web Crawler API',
      description: 'Crawl SPA, SSR, and PWA websites and save as HTML files',
      endpoints: {
        'GET  /': 'API info',
        'POST /api/crawl': 'Crawl a single URL. Body: { "url": "https://..." }',
        'POST /api/crawl-all': 'Crawl all predefined target websites',
      },
      targets: TARGETS.map((t) => t.url),
    });
  });

  app.post('/api/crawl', async (req, res) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'url is required in request body' });
    }

    try {
      new URL(url);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid URL format' });
    }

    const result = await crawl(url);
    if (result.success) {
      res.json({
        success: true,
        message: `Crawled and saved as ${result.filename}`,
        url: result.url,
        filename: result.filename,
        filepath: result.filepath,
        size: result.size,
      });
    } else {
      res.status(500).json({ success: false, url, error: result.error });
    }
  });

  app.post('/api/crawl-all', async (_req, res) => {
    const results = await crawlAll();
    res.json({ success: true, results });
  });

  return app;
}

const command = process.argv[2];

if (command === 'serve') {
  const PORT = process.env.PORT || 3000;
  const app = createServer();
  app.listen(PORT, () => {
    console.log(`Web Crawler API running on http://localhost:${PORT}`);
    console.log('\nEndpoints:');
    console.log('  GET  /');
    console.log('  POST /api/crawl       body: { "url": "https://..." }');
    console.log('  POST /api/crawl-all');
  });
} else {
  crawlAll()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
