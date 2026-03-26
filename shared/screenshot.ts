import { chromium } from 'playwright';

export interface ScreenshotOptions {
  selector?: string;   // CSS-selektor — screenshota bara detta element
  mobile?: boolean;    // mobil-viewport (375×812)
  headers?: Record<string, string>;
  cookies?: Array<{name: string; value: string; domain: string}>;
  waitForSelector?: string;
}

export async function takeScreenshot(
  url: string,
  outputPath: string,
  options: ScreenshotOptions = {}
): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Viewport: mobil eller desktop
  const viewport = options.mobile
    ? { width: 375, height: 812 }
    : { width: 1280, height: 900 };
  await page.setViewportSize(viewport);

  // Sätt cookies innan navigering
  if (options.cookies?.length) {
    await page.context().addCookies(options.cookies);
  }

  // Sätt extra HTTP-headers
  if (options.headers) {
    await page.setExtraHTTPHeaders(options.headers);
  }

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Vänta på specifikt element om konfigurerat, annars 2 sekunder
  if (options.waitForSelector) {
    await page.waitForSelector(options.waitForSelector, { timeout: 10000 }).catch(() => {
      console.warn(`  ⚠ waitForSelector "${options.waitForSelector}" timeout — fortsätter ändå`);
    });
  } else {
    await page.waitForTimeout(2000);
  }

  if (options.selector) {
    // Screenshota bara det valda elementet
    const element = await page.$(options.selector);
    if (element) {
      await element.screenshot({ path: outputPath });
    } else {
      console.warn(`  ⚠ Selektor "${options.selector}" hittades inte — tar fullständig screenshot istället`);
      await page.screenshot({ path: outputPath, fullPage: false });
    }
  } else {
    await page.screenshot({ path: outputPath, fullPage: false });
  }

  await browser.close();
  console.log(`Screenshot sparad: ${outputPath}`);
}
