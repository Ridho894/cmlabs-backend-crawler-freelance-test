const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function urlToFilename(url) {
  const parsed = new URL(url);
  const hostname = parsed.hostname.replace(/\./g, '_');
  const pathPart = parsed.pathname.replace(/\//g, '_').replace(/^_+|_+$/g, '');
  return pathPart ? `${hostname}_${pathPart}.html` : `${hostname}.html`;
}

async function crawl(url, options = {}) {
  const {
    timeout = 60000,
    outputDir = OUTPUT_DIR,
    userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  } = options;

  console.log(`[Crawler] Starting: ${url}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout });

    await page.waitForTimeout(2000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const SCROLL_LOCK_CLASSES = [
        'modal-open', 'overflow-hidden', 'no-scroll', 'noscroll',
        'is-clipped', 'is-locked', 'overlay-open',
      ];
      [document.body, document.documentElement].forEach((el) => {
        el.style.overflow = '';
        el.style.overflowY = '';
        el.style.paddingRight = '';
        el.classList.remove(...SCROLL_LOCK_CLASSES);
      });

      document.querySelectorAll(
        '.modal.show, [role="dialog"][aria-modal="true"], [role="alertdialog"]'
      ).forEach((el) => {
        el.style.display = 'none';
      });

      document.querySelectorAll(
        '.modal-backdrop, .overlay-backdrop, .dialog-overlay'
      ).forEach((el) => el.remove());
    });

    const html = await page.content();

    const finalOrigin = new URL(page.url()).origin;
    const baseTag = `<base href="${finalOrigin}/">`;

    const processedHtml = html
      .replace(/(<head[^>]*>)/i, `$1\n  ${baseTag}`)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\bloading="lazy"/gi, 'loading="eager"')
      .replace(/(<img[^>]*)\bwidth="0"\s+height="0"/gi, '$1');

    console.log(`[Crawler] Final URL: ${page.url()}`);

    const filename = urlToFilename(url);
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, processedHtml, 'utf-8');

    const stats = fs.statSync(filepath);
    console.log(`[Crawler] Saved: ${filepath} (${(stats.size / 1024).toFixed(1)} KB)`);

    return { success: true, url, filepath, filename, size: stats.size };
  } catch (error) {
    console.error(`[Crawler] Error crawling ${url}: ${error.message}`);
    return { success: false, url, error: error.message };
  } finally {
    await context.close();
    await browser.close();
  }
}

module.exports = { crawl, urlToFilename, OUTPUT_DIR };
