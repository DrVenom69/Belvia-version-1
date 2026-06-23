/**
 * MakerWorld Playwright Scraper
 * Uses a real Chromium browser to bypass Cloudflare and extract product data
 * from MakerWorld model pages without any AI dependency.
 */

import { chromium, type Browser, type Page } from "playwright";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { uploadToR2 } from "../server/r2";

// Lazy browser singleton — reused across requests for performance
let browserInstance: Browser | null = null;
let processListenersRegistered = false;

function registerProcessListeners() {
  if (processListenersRegistered) return;
  processListenersRegistered = true;

  const cleanUp = async (signal: string) => {
    if (browserInstance) {
      console.log(`[Scraper] Received ${signal}. Closing Chromium browser singleton...`);
      try {
        await browserInstance.close();
        browserInstance = null;
        console.log(`[Scraper] Chromium browser closed successfully.`);
      } catch (err: any) {
        console.error(`[Scraper] Error closing browser during ${signal} cleanup:`, err.message);
      }
    }
  };

  const signals = ["SIGINT", "SIGTERM", "SIGUSR2"];
  signals.forEach((signal) => {
    process.once(signal, async () => {
      await cleanUp(signal);
      process.exit(0);
    });
  });

  process.on("exit", () => {
    if (browserInstance) {
      console.warn("[Scraper] Process exiting with open browser instance.");
    }
  });
}

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      headless: true,
      handleSIGINT: false,
      handleSIGTERM: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-infobars",
        "--window-size=1280,900",
        "--disable-extensions",
        "--no-first-run",
        "--disable-default-apps",
        "--lang=en-US",
      ],
    });
    // Register process lifecycle listeners on-demand
    registerProcessListeners();
  }
  return browserInstance;
}

export interface ScrapedMakerWorldProduct {
  title: string;
  description: string;
  tags: string[];
  category: string;
  likes: number;
  downloads: number;
  designerName: string;
  makerWorldUrl: string;
  images: string[]; // remote URLs from makerworld CDN
  localImages: string[]; // saved to public/images/products/
  printProfile: {
    material: string;
    weight: string; // e.g. "45g"
    printTime: string; // e.g. "3h 20m"
    layerHeight: string; // e.g. "0.2mm"
    infill: string; // e.g. "15%"
    supports: string;
  };
  dimensions: string;
  scrapedAt: string;
}

export async function scrapeMakerWorldPage(
  url: string,
  outputDir: string
): Promise<ScrapedMakerWorldProduct> {
  let targetProfileId: string | null = null;
  try {
    const urlObj = new URL(url);
    const hash = urlObj.hash;
    const match = hash.match(/profileId-(\d+)/);
    if (match) {
      targetProfileId = match[1];
      console.log(`[Scraper] Targeted profile ID from URL hash: ${targetProfileId}`);
    }
  } catch (e) { /* ignore */ }

  // ==========================================
  // Strategy 1: Try MakerWorld's internal API
  // The model ID is in the URL (e.g., /models/1997073-toothless)
  // MakerWorld loads data via /api/v1/model/{id} internally
  // ==========================================
  let modelId: string | null = null;
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    // Find the models segment
    const modelsIdx = pathParts.indexOf('models');
    if (modelsIdx >= 0 && pathParts[modelsIdx + 1]) {
      const modelSlug = pathParts[modelsIdx + 1];
      const idMatch = modelSlug.match(/^(\d+)/);
      if (idMatch) modelId = idMatch[1];
    }
  } catch (e) { /* ignore */ }

  // Try API first — much simpler than full page scrape
  if (modelId) {
    try {
      const apiResult = await tryMakerWorldAPI(modelId, url, outputDir, targetProfileId);
      if (apiResult) {
        console.log(`[Scraper] ✅ API success: "${apiResult.title}"`);
        return apiResult;
      }
    } catch (apiErr: any) {
      console.warn('[Scraper] API approach failed, falling back to Playwright:', apiErr.message);
    }
  }

  // ==========================================
  // Strategy 2: Playwright with network interception
  // Launches real browser, intercepts API calls the page makes
  // ==========================================
  return await scrapeWithPlaywright(url, modelId, outputDir, targetProfileId);
}

// Helper function to extract weight from print profile instances in a robust way
function getWeightFromInstance(inst: any): number {
  if (!inst) return 0;
  
  // 1. Direct weight fields
  if (typeof inst.weight === 'number' && inst.weight > 0) return inst.weight;
  if (typeof inst.weight === 'string' && parseFloat(inst.weight) > 0) return parseFloat(inst.weight);
  
  if (typeof inst.weightGrams === 'number' && inst.weightGrams > 0) return inst.weightGrams;
  if (typeof inst.weightGrams === 'string' && parseFloat(inst.weightGrams) > 0) return parseFloat(inst.weightGrams);

  if (typeof inst.filamentWeight === 'number' && inst.filamentWeight > 0) return inst.filamentWeight;
  if (typeof inst.filamentWeight === 'string' && parseFloat(inst.filamentWeight) > 0) return parseFloat(inst.filamentWeight);

  // 2. Try instanceFilaments array
  if (Array.isArray(inst.instanceFilaments) && inst.instanceFilaments.length > 0) {
    let sum = 0;
    for (const f of inst.instanceFilaments) {
      const g = parseFloat(f.usedG || f.weight || f.weightGrams || 0);
      if (g > 0) sum += g;
    }
    if (sum > 0) return sum;
  }

  // 3. Try plates
  if (inst.extention && inst.extention.modelInfo && Array.isArray(inst.extention.modelInfo.plates)) {
    let sum = 0;
    for (const plate of inst.extention.modelInfo.plates) {
      if (typeof plate.weight === 'number' && plate.weight > 0) {
        sum += plate.weight;
      } else if (typeof plate.weight === 'string' && parseFloat(plate.weight) > 0) {
        sum += parseFloat(plate.weight);
      } else if (Array.isArray(plate.filaments)) {
        for (const f of plate.filaments) {
          const g = parseFloat(f.usedG || f.weight || 0);
          if (g > 0) sum += g;
        }
      }
    }
    if (sum > 0) return sum;
  }

  return 0;
}

// ---- Strategy 1: Internal MakerWorld API via Bambu Lab design service ----
async function tryMakerWorldAPI(
  modelId: string,
  originalUrl: string,
  outputDir: string,
  targetProfileId: string | null
): Promise<ScrapedMakerWorldProduct | null> {
  // MakerWorld's actual internal API (used by their own frontend)
  const endpoints = [
    `https://api.bambulab.com/v1/design-service/design/${modelId}?trafficSource=browse&visitHistory=true`,
    `https://makerworld.com/api/v1/design/detail?modelId=${modelId}`,
    `https://makerworld.com/api/v1/model/${modelId}/detail`,
  ];

  let json: any = null;
  for (const apiUrl of endpoints) {
    try {
      console.log(`[Scraper] Trying API endpoint: ${apiUrl}`);
      const res = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://makerworld.com',
          'Referer': 'https://makerworld.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
        }
      });
      console.log(`[Scraper] API ${apiUrl.slice(0, 50)} -> status ${res.status}`);
      if (res.ok) {
        const body = await res.json();
        if (body && typeof body === 'object') {
          json = body;
          break;
        }
      }
    } catch (err: any) {
      console.warn(`[Scraper] API endpoint failed: ${err.message}`);
    }
  }

  if (!json) return null;

  // Parse Bambu Lab design-service response
  // The design data is either at root or nested under .design or .data
  const model = json.design || json.data || json;
  const title = model.title || model.name || model.designName || '';

  if (!title || title.length < 2) {
    console.warn('[Scraper] API response has no title, bailing out');
    return null;
  }

  console.log(`[Scraper] ✅ API got title: "${title}"`);

  const description = model.description || model.designDescription || model.intro || '';
  const designerName = model.designer?.name || model.user?.name || model.creatorName || '';
  const likes = model.likeCount || model.like_count || model.likes || 0;
  const downloads = model.downloadCount || model.download_count || model.downloads || 0;

  // Tags
  const rawTags = model.tags || model.categories || model.tagList || [];
  const tags: string[] = rawTags.map((t: any) => typeof t === 'string' ? t : t.name || t.tagName || '').filter(Boolean);

  // Images — Bambu API gives cover, coverPortrait, coverLandscape, coverImages arrays
  const remoteImages: string[] = [];
  if (model.cover) remoteImages.push(model.cover);
  if (model.coverPortrait && model.coverPortrait.startsWith('http')) remoteImages.push(model.coverPortrait);
  if (model.coverLandscape && model.coverLandscape.startsWith('http')) remoteImages.push(model.coverLandscape);
  if (model.coverUrl) remoteImages.push(model.coverUrl);

  const extension = model.designExtension || json.designExtension || {};
  if (Array.isArray(extension.design_pictures)) {
    extension.design_pictures.forEach((pic: any) => {
      const src = typeof pic === 'string' ? pic : pic.url || pic.picUrl || '';
      if (src && !remoteImages.includes(src)) remoteImages.push(src);
    });
  }

  if (Array.isArray(model.coverImages)) {
    model.coverImages.forEach((img: any) => {
      const src = typeof img === 'string' ? img : img.url || img.src || '';
      if (src && !remoteImages.includes(src)) remoteImages.push(src);
    });
  }
  if (Array.isArray(model.designPictures)) {
    model.designPictures.forEach((img: any) => {
      const src = typeof img === 'string' ? img : img.url || img.src || img.picUrl || '';
      if (src && !remoteImages.includes(src)) remoteImages.push(src);
    });
  }
  if (Array.isArray(model.pictures)) {
    model.pictures.forEach((img: any) => {
      const src = typeof img === 'string' ? img : img.url || img.picUrl || '';
      if (src && !remoteImages.includes(src)) remoteImages.push(src);
    });
  }

  // Collect pictures from all instances/profiles
  const apiInstances = json.instances || model.instances || [];
  if (Array.isArray(apiInstances)) {
    apiInstances.forEach((inst: any) => {
      if (Array.isArray(inst.pictures)) {
        inst.pictures.forEach((img: any) => {
          const src = typeof img === 'string' ? img : img.url || img.picUrl || img.cover || '';
          if (src && !remoteImages.includes(src)) remoteImages.push(src);
        });
      }
    });
  }

  console.log(`[Scraper] Found ${remoteImages.length} images from API (including instances)`);

  // Download images locally - increased limit
  const localImages = await downloadImages(remoteImages.slice(0, 20), title, outputDir);

  // Print profile specs extraction from instances
  let weight = '';
  let printTime = '';
  let material = 'PLA';
  let layerHeight = '0.2mm';
  let infill = '15%';
  let supports = 'None';

  const printSettings = model.printSettings || model.print_settings || model.sliceInfo || {};
  if (printSettings && typeof printSettings === 'object') {
    material = printSettings.material || printSettings.filamentType || material;
    weight = printSettings.filamentWeight || printSettings.weight ? `${printSettings.filamentWeight || printSettings.weight}g` : weight;
    printTime = printSettings.printTime || printSettings.print_time || printTime;
    layerHeight = printSettings.layerHeight ? `${printSettings.layerHeight}mm` : layerHeight;
    infill = printSettings.infill ? `${printSettings.infill}%` : infill;
    supports = printSettings.supportRequired !== undefined ? (printSettings.supportRequired ? 'Yes' : 'None') : supports;
  }

  if (Array.isArray(apiInstances) && apiInstances.length > 0) {
    let bestInst = null;
    if (targetProfileId) {
      bestInst = apiInstances.find((inst: any) => String(inst.id) === targetProfileId || String(inst.profileId) === targetProfileId);
      if (bestInst) {
        console.log(`[Scraper] Successfully matched targeted profile: "${bestInst.title}" (ID: ${bestInst.id})`);
      }
    }
    if (!bestInst) {
      bestInst = apiInstances.find((inst: any) => inst.isDefault) ||
        apiInstances.reduce((best: any, curr: any) => {
          const bestDL = best.downloadCount || best.downloads || 0;
          const currDL = curr.downloadCount || curr.downloads || 0;
          return currDL > bestDL ? curr : best;
        }, apiInstances[0]);
    }

    if (bestInst) {
      const instWeight = getWeightFromInstance(bestInst);
      if (instWeight > 0) {
        weight = `${instWeight}g`;
      }
      if (bestInst.prediction) {
        const totalSeconds = bestInst.prediction;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        printTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      }
      if (Array.isArray(bestInst.instanceFilaments) && bestInst.instanceFilaments.length > 0) {
        const types = bestInst.instanceFilaments.map((f: any) => f.type).filter(Boolean);
        if (types.length > 0) {
          material = [...new Set(types)].join(', ');
        }
      }
      const instTitle = bestInst.title || '';
      const layerMatch = instTitle.match(/(\d+(?:\.\d+)?)\s*mm/);
      if (layerMatch) layerHeight = `${layerMatch[1]}mm`;
      
      const infillMatch = instTitle.match(/(\d+)\s*%/);
      if (infillMatch) infill = `${infillMatch[1]}%`;
    }
  }

  const printProfile = {
    material,
    weight,
    printTime,
    layerHeight,
    infill,
    supports
  };

  const dimensions = model.dimensions || printSettings.dimensions || '';

  // Category detection
  const allText = `${title} ${tags.join(' ')} ${description}`.toLowerCase();
  const category = detectCategory(allText);

  return {
    title,
    description,
    tags,
    category,
    likes,
    downloads,
    designerName,
    makerWorldUrl: originalUrl,
    images: remoteImages,
    localImages,
    printProfile,
    dimensions,
    scrapedAt: new Date().toISOString(),
  };
}




// ---- Helper: Detect product category from text ----
function detectCategory(text: string): string {
  // 1. Conflict Resolution / Specific Rules First (Priority Order)
  if (text.includes('phone case') || text.includes('phone stand')) {
    return 'Desk Accessories';
  }
  if (text.includes('kit car') || text.includes('rc car') || text.includes('model car')) {
    return 'Figures & Collectibles';
  }
  if (text.includes('fidget') || text.includes('spinner')) {
    return 'Gaming Accessories';
  }
  if (text.includes('magnet')) {
    // If text contains 'magnet' AND NOT 'keychain', it must NOT be Keychains
    // We can directly return 'Home Decor' as specified in common conflict resolution rules: "magnet → Home Decor (not Keychain)"
    if (!text.includes('keychain') && !text.includes('key chain') && !text.includes('key tag')) {
      return 'Home Decor';
    }
  }

  // 2. Standard Category Rules
  // Keychains (only if it doesn't conflict with magnet exclusion rule, which is already handled above)
  if (text.includes('keychain') || text.includes('key chain') || text.includes('key tag')) {
    return 'Keychains';
  }
  
  // Home Decor
  if (
    text.includes('vase') || 
    text.includes('pot') || 
    text.includes('decor') || 
    text.includes('lamp') || 
    text.includes('candle') || 
    text.includes('planter') ||
    text.includes('magnet')
  ) {
    return 'Home Decor';
  }
  
  // Desk Accessories
  if (
    text.includes('stand') || 
    text.includes('holder') || 
    text.includes('organizer') || 
    text.includes('desk') || 
    text.includes('pen')
  ) {
    return 'Desk Accessories';
  }
  
  // Gaming Accessories
  if (
    text.includes('game') || 
    text.includes('controller') || 
    text.includes('switch') || 
    text.includes('gaming') || 
    text.includes('nintendo') || 
    text.includes('playstation') || 
    text.includes('xbox')
  ) {
    return 'Gaming Accessories';
  }
  
  // Business Merchandise
  if (
    text.includes('business') || 
    text.includes('logo') || 
    text.includes('brand') || 
    text.includes('corporate') || 
    text.includes('card')
  ) {
    return 'Business Merchandise';
  }
  
  // Functional Prints
  if (
    text.includes('tool') || 
    text.includes('functional') || 
    text.includes('bracket') || 
    text.includes('mount') || 
    text.includes('clip') || 
    text.includes('connector')
  ) {
    return 'Functional Prints';
  }

  // Default fallback
  return 'Figures & Collectibles';
}

// ---- Helper: Compress buffer with sharp and upload to R2 ----
// GIFs are never recompressed to preserve animation.
// All other formats are resized to max 1200px width and quality-compressed.
async function compressAndUpload(
  rawBuffer: Buffer,
  fileName: string,
  outputDir: string
): Promise<string> {
  const ext = path.extname(fileName).toLowerCase().replace('.', '');
  const filePath = path.join(outputDir, fileName);
  const originalSize = rawBuffer.length;

  let finalBuffer: Buffer;
  let contentType: string;

  if (ext === 'gif') {
    // Never compress GIFs — upload as-is to preserve animation
    finalBuffer = rawBuffer;
    contentType = 'image/gif';
    console.log(`[Scraper] GIF detected — skipping compression: ${fileName} (${originalSize} bytes)`);
  } else {
    try {
      const image = sharp(rawBuffer);
      const metadata = await image.metadata();

      // Resize to max 1200px wide if needed
      let pipeline = image;
      if (metadata.width && metadata.width > 1200) {
        pipeline = pipeline.resize({ width: 1200, withoutEnlargement: true });
      }

      if (ext === 'png') {
        finalBuffer = await pipeline.png({ quality: 80, compressionLevel: 9 }).toBuffer();
        contentType = 'image/png';
      } else if (ext === 'jpg' || ext === 'jpeg') {
        finalBuffer = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
        contentType = 'image/jpeg';
      } else {
        // webp and anything else → webp
        finalBuffer = await pipeline.webp({ quality: 80 }).toBuffer();
        contentType = 'image/webp';
      }

      const saving = (((originalSize - finalBuffer.length) / originalSize) * 100).toFixed(1);
      console.log(`[Scraper] Compressed ${fileName}: ${originalSize} → ${finalBuffer.length} bytes (${saving}% saved)`);
    } catch (compressErr: any) {
      console.warn(`[Scraper] Compression failed for ${fileName}, using raw buffer:`, compressErr.message);
      finalBuffer = rawBuffer;
      contentType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/webp';
    }
  }

  // Save locally for reference
  fs.writeFileSync(filePath, finalBuffer);

  // Upload to R2 and return the public URL
  const r2Key = `images/products/${fileName}`;
  const publicUrl = await uploadToR2(finalBuffer, r2Key, contentType);
  return publicUrl;
}

// ---- Helper: Download images with correct filename ----
async function downloadImages(imageUrls: string[], title: string, outputDir: string): Promise<string[]> {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const productSlug = `belvia-${cleanTitle}`;
  const localImages: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const imgUrl = imageUrls[i];
    try {
      const suffix = i === 0 ? '' : `-${i + 1}`;
      const ext = imgUrl.includes('.gif') ? 'gif' : imgUrl.includes('.png') ? 'png' : imgUrl.includes('.jpg') || imgUrl.includes('.jpeg') ? 'jpg' : 'webp';
      const fileName = `${productSlug}${suffix}.${ext}`;

      const imgRes = await fetch(imgUrl, {
        headers: { 'Referer': 'https://makerworld.com/', 'User-Agent': 'Mozilla/5.0' }
      });
      if (imgRes.ok) {
        const rawBuffer = Buffer.from(await imgRes.arrayBuffer());
        const publicUrl = await compressAndUpload(rawBuffer, fileName, outputDir);
        localImages.push(publicUrl);
        console.log(`[Scraper] ✅ Uploaded image ${i + 1}/${imageUrls.length}: ${fileName} → ${publicUrl}`);
      }
    } catch (imgErr: any) {
      console.warn(`[Scraper] Failed to download image ${i + 1}:`, imgErr.message);
    }
  }

  return localImages;
}

// ---- Strategy 2: Playwright with network interception ----
async function scrapeWithPlaywright(
  url: string,
  modelId: string | null,
  outputDir: string,
  targetProfileId?: string | null
): Promise<ScrapedMakerWorldProduct> {
  const browser = await getBrowser();
  let page: Page | null = null;

  // Capture API responses the page makes internally
  let capturedApiData: any = null;
  const capturedImages: string[] = [];

  try {
    page = await browser.newPage();

    // Network interception: capture API calls the page makes to MakerWorld
    page.on('response', async (response) => {
      const respUrl = response.url();
      // Intercept MakerWorld's model API calls
      if (respUrl.includes('/api/') && respUrl.includes('model') && response.status() === 200) {
        try {
          const body = await response.json();
          if (body && (body.name || body.title || body.data?.name)) {
            capturedApiData = body;
            console.log(`[Scraper] Intercepted API call: ${respUrl.slice(0, 80)}`);
          }
        } catch (e) { /* not JSON */ }
      }
      // Capture image URLs from CDN responses
      const ct = response.headers()['content-type'] || '';
      if (ct.startsWith('image/') && (respUrl.includes('makerworld') || respUrl.includes('bambulab') || respUrl.includes('cdn'))) {
        if (!capturedImages.includes(respUrl) && !respUrl.includes('avatar') && !respUrl.includes('profile')) {
          capturedImages.push(respUrl);
        }
      }
    });

    // Stealth mode: override webdriver flags that Cloudflare checks
    await page.addInitScript(() => {
      // Remove Playwright/webdriver detection flags
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      // @ts-ignore
      delete navigator.__proto__.webdriver;
      // Fake plugins list (real browsers have these)
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      // Fake languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });

    // Spoof user agent and viewport to look like a real Chrome user
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "sec-ch-ua":
        '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "Upgrade-Insecure-Requests": "1",
      "Cache-Control": "max-age=0",
    });
    await page.setViewportSize({ width: 1280, height: 900 });

    // Navigate with a real browser — Cloudflare sees this as a genuine visit
    console.log(`[Scraper] Navigating to: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Check if Cloudflare challenge page appeared (title will be the domain)
    let pageTitle = await page.title();
    console.log(`[Scraper] Page title after initial load: "${pageTitle}"`);

    // If Cloudflare challenge, wait for it to clear (up to 30s)
    if (pageTitle.toLowerCase().includes('makerworld.com') && !pageTitle.toLowerCase().includes('toothless') && !pageTitle.toLowerCase().includes('model')) {
      console.log('[Scraper] Cloudflare challenge detected. Waiting for it to resolve...');
      // Wait for the actual page content
      await page.waitForFunction(
        () => document.title.length > 10 && !document.title.toLowerCase().startsWith('just a moment'),
        { timeout: 30000 }
      ).catch(() => console.warn('[Scraper] Cloudflare challenge may not have resolved.'));
      pageTitle = await page.title();
      console.log(`[Scraper] Page title after CF wait: "${pageTitle}"`);
    }

    // Wait for the main content to render (MakerWorld uses React SPA)
    await page
      .waitForSelector("h1", { timeout: 25000 })
      .catch(() =>
        console.warn("[Scraper] h1 not found within timeout, continuing...")
      );

    // Extra time for lazy-loaded images and dynamic content
    await page.waitForTimeout(5000);

    // === EXTRACT DATA FROM DOM ===
    const extracted = await page.evaluate(() => {
      // ---- Title ----
      const h1 = document.querySelector("h1");
      const title = h1?.textContent?.trim() || "";

      // ---- Description ----
      // MakerWorld description is usually in a richtext div after the title
      const descSelectors = [
        '[class*="description"]',
        '[class*="content"] p',
        '[class*="model-description"]',
        '[class*="detail"] p',
        "article p",
        ".mw-model-description",
      ];
      let description = "";
      for (const sel of descSelectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent && el.textContent.trim().length > 30) {
          description = el.textContent.trim();
          break;
        }
      }
      // Fallback: grab any large <p> block
      if (!description) {
        const paras = Array.from(document.querySelectorAll("p"))
          .filter((p) => (p.textContent || "").trim().length > 40)
          .slice(0, 3);
        description = paras.map((p) => p.textContent?.trim()).join(" ");
      }

      // ---- Tags ----
      // MakerWorld renders tags as small chip/badge elements
      const tagSelectors = [
        '[class*="tag"]',
        '[class*="chip"]',
        '[class*="badge"]',
        '[class*="label"]',
      ];
      const tagSet = new Set<string>();
      for (const sel of tagSelectors) {
        document.querySelectorAll(sel).forEach((el) => {
          const text = el.textContent?.trim();
          if (text && text.length < 30 && text.length > 1) {
            tagSet.add(text);
          }
        });
      }
      const tags = [...tagSet].filter(Boolean).slice(0, 10);

      // ---- Designer name ----
      const designerSelectors = [
        '[class*="designer"]',
        '[class*="author"]',
        '[class*="creator"]',
        '[class*="user-name"]',
        '[class*="username"]',
      ];
      let designerName = "";
      for (const sel of designerSelectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent) {
          designerName = el.textContent.trim();
          break;
        }
      }

      // ---- Stats: likes and downloads ----
      const statsText = document.body.innerText;
      const likesMatch = statsText.match(/(\d[\d,]*)\s*(?:likes?|♥)/i);
      const downloadsMatch = statsText.match(/(\d[\d,]*)\s*(?:downloads?)/i);
      const likes = likesMatch
        ? parseInt(likesMatch[1].replace(/,/g, ""))
        : 0;
      const downloads = downloadsMatch
        ? parseInt(downloadsMatch[1].replace(/,/g, ""))
        : 0;

      // ---- Print profile specs ----
      const fullText = document.body.innerText;

      // Weight (filament) — try labeled patterns first, fall back to generic
      // Priority: labeled fields like "Weight: 45g", "Filament: 82g", "Filament weight: 120g"
      const weightLabeledMatch = fullText.match(
        /(?:weight|filament|mass|material used|plastic)[^\n]*?[:\s]\s*(\d+(?:\.\d+)?)\s*g(?:rams?)?/i
      );
      // Secondary: standalone weight line like "45g" near print stats
      const weightStandaloneMatch = fullText.match(
        /(?:^|\n)\s*(\d+(?:\.\d+)?)\s*g(?:rams?)?\s*(?:$|\n)/im
      );
      // Fallback: first number followed by g in the page
      const weightFallbackMatch = fullText.match(/(\d+(?:\.\d+)?)\s*g(?:rams?)?/i);
      const weightRaw =
        weightLabeledMatch?.[1] ||
        weightStandaloneMatch?.[1] ||
        weightFallbackMatch?.[1] ||
        "";
      const weight = weightRaw ? `${weightRaw}g` : "";

      // Print time
      const timePatterns = [
        /(\d+)\s*h(?:ours?)?\s*(\d+)\s*m(?:in(?:utes?)?)?/i,
        /(\d+)\s*h(?:ours?)?/i,
        /(\d+)\s*m(?:in(?:utes?)?)/i,
      ];
      let printTime = "";
      for (const pattern of timePatterns) {
        const m = fullText.match(pattern);
        if (m) {
          if (m[2]) {
            printTime = `${m[1]}h ${m[2]}m`;
          } else if (pattern.source.includes("h")) {
            printTime = `${m[1]}h`;
          } else {
            printTime = `${m[1]}m`;
          }
          break;
        }
      }

      // Layer height
      const layerMatch = fullText.match(/(\d+(?:\.\d+)?)\s*mm\s*(?:layer|Layer)/i);
      const layerHeight = layerMatch ? `${layerMatch[1]}mm` : "0.2mm";

      // Infill
      const infillMatch = fullText.match(/(\d+)\s*%\s*(?:infill|Infill|fill|gyroid|grid|honeycomb|cubic)/i);
      const infillTypeMatch = fullText.match(/(?:infill|fill):\s*(\d+%\s*\w+)/i);
      const infill = infillTypeMatch
        ? infillTypeMatch[1]
        : infillMatch
        ? `${infillMatch[1]}%`
        : "15%";

      // Material
      const materialPatterns = [
        /\b(PLA\+?|PETG|ABS|ASA|TPU|PA(?:\s*-?\s*CF)?|PC|HIPS)\b/gi,
      ];
      const materials = new Set<string>();
      for (const pat of materialPatterns) {
        const matches = fullText.matchAll(pat);
        for (const m of matches) {
          materials.add(m[1].toUpperCase());
        }
      }
      const material = [...materials].slice(0, 3).join(", ") || "PLA";

      // Supports
      const supportsMatch = fullText.match(/supports?\s*:?\s*(yes|no|needed|required|none|not needed)/i);
      const supports = supportsMatch ? supportsMatch[1] : "None";

      // ---- Dimensions ----
      const dimMatch = fullText.match(
        /(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)/i
      );
      const dimensions = dimMatch
        ? `${dimMatch[1]} × ${dimMatch[2]} × ${dimMatch[3]} mm`
        : "";

      // ---- Images ----
      // Grab all <img> tags with makerworld/bambulab CDN URLs
      const allImages: string[] = [];

      // Check meta og:image first (highest quality main image)
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        const content = ogImage.getAttribute("content");
        if (content && content.startsWith("http")) {
          allImages.push(content);
        }
      }

      // Grab all img tags from CDN
      document.querySelectorAll("img").forEach((img) => {
        const src = img.src || img.getAttribute("src") || "";
        if (
          src.startsWith("http") &&
          (src.includes("makerworld") ||
            src.includes("bambulab") ||
            src.includes("cdn")) &&
          !src.includes("avatar") &&
          !src.includes("profile") &&
          !src.includes("icon") &&
          src.length > 20
        ) {
          if (!allImages.includes(src)) {
            allImages.push(src);
          }
        }
      });

      // Also check background-image CSS (some thumbnails use this)
      document
        .querySelectorAll('[class*="image"], [class*="cover"], [class*="thumb"]')
        .forEach((el) => {
          const style = window.getComputedStyle(el);
          const bg = style.backgroundImage;
          if (bg && bg !== "none") {
            const match = bg.match(/url\(["']?(https?:\/\/[^"')]+)["']?\)/);
            if (match && !allImages.includes(match[1])) {
              allImages.push(match[1]);
            }
          }
        });

      return {
        title,
        description,
        tags,
        designerName,
        likes,
        downloads,
        images: allImages.slice(0, 20), // max 20 images
        printProfile: {
          material,
          weight,
          printTime,
          layerHeight,
          infill,
          supports,
        },
        dimensions,
      };
    });

    // ---- Merge network-captured API data (more reliable than DOM) ----
    if (capturedApiData) {
      const apiModel = capturedApiData.model || capturedApiData.data || capturedApiData;
      const apiTitle = apiModel.name || apiModel.title;
      const apiDesc = apiModel.description || apiModel.intro;
      if (apiTitle && apiTitle.length > 2) {
        console.log(`[Scraper] Using intercepted API title: "${apiTitle}"`);
        extracted.title = apiTitle;
      }
      if (apiDesc && apiDesc.length > 10) {
        extracted.description = apiDesc;
      }
      if (Array.isArray(apiModel.tags)) {
        extracted.tags = apiModel.tags.map((t: any) => typeof t === 'string' ? t : t.name || '');
      }
      extracted.likes = apiModel.like_count || apiModel.likes || extracted.likes;
      extracted.downloads = apiModel.download_count || apiModel.downloads || extracted.downloads;
      // Add API-provided images to front of list
      const apiImages: string[] = [];
      if (apiModel.cover) apiImages.push(apiModel.cover);
      if (Array.isArray(apiModel.images)) {
        apiModel.images.forEach((img: any) => {
          const src = typeof img === 'string' ? img : img.url || '';
          if (src) apiImages.push(src);
        });
      }

      const extension = apiModel.designExtension || capturedApiData.designExtension || {};
      if (Array.isArray(extension.design_pictures)) {
        extension.design_pictures.forEach((pic: any) => {
          const src = typeof pic === 'string' ? pic : pic.url || pic.picUrl || '';
          if (src && !apiImages.includes(src)) apiImages.push(src);
        });
      }

      // Merge print specs and images from instances in captured API data
      const apiInstances = capturedApiData.instances || apiModel.instances || [];
      if (Array.isArray(apiInstances)) {
        apiInstances.forEach((inst: any) => {
          if (Array.isArray(inst.pictures)) {
            inst.pictures.forEach((img: any) => {
              const src = typeof img === 'string' ? img : img.url || img.picUrl || img.cover || '';
              if (src && !apiImages.includes(src)) apiImages.push(src);
            });
          }
        });

        if (apiInstances.length > 0) {
          let bestInst = null;
          if (targetProfileId) {
            bestInst = apiInstances.find((inst: any) => String(inst.id) === targetProfileId || String(inst.profileId) === targetProfileId);
            if (bestInst) {
              console.log(`[Scraper] Successfully matched targeted profile in Playwright network: "${bestInst.title}" (ID: ${bestInst.id})`);
            }
          }
          if (!bestInst) {
            bestInst = apiInstances.find((inst: any) => inst.isDefault) ||
              apiInstances.reduce((best: any, curr: any) => {
                const bestDL = best.downloadCount || best.downloads || 0;
                const currDL = curr.downloadCount || curr.downloads || 0;
                return currDL > bestDL ? curr : best;
              }, apiInstances[0]);
          }

          if (bestInst) {
            const instWeight = getWeightFromInstance(bestInst);
            if (instWeight > 0) {
              extracted.printProfile.weight = `${instWeight}g`;
            }
            if (bestInst.prediction) {
              const totalSeconds = bestInst.prediction;
              const hours = Math.floor(totalSeconds / 3600);
              const minutes = Math.floor((totalSeconds % 3600) / 60);
              extracted.printProfile.printTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            }
            if (Array.isArray(bestInst.instanceFilaments) && bestInst.instanceFilaments.length > 0) {
              const types = bestInst.instanceFilaments.map((f: any) => f.type).filter(Boolean);
              if (types.length > 0) {
                extracted.printProfile.material = [...new Set(types)].join(', ');
              }
            }
            const instTitle = bestInst.title || '';
            const layerMatch = instTitle.match(/(\d+(?:\.\d+)?)\s*mm/);
            if (layerMatch) extracted.printProfile.layerHeight = `${layerMatch[1]}mm`;
            
            const infillMatch = instTitle.match(/(\d+)\s*%/);
            if (infillMatch) extracted.printProfile.infill = `${infillMatch[1]}%`;
          }
        }
      }

      extracted.images = [...new Set([...apiImages, ...capturedImages, ...extracted.images])].slice(0, 20);
    } else if (capturedImages.length > 0) {
      // Even without API data, use network-captured image URLs
      extracted.images = [...new Set([...capturedImages, ...extracted.images])].slice(0, 20);
    }

    // ---- Download, compress, and upload images to R2 ----

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const cleanTitle = extracted.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const productSlug = `belvia-${cleanTitle}`;
    const localImages: string[] = [];

    for (let i = 0; i < extracted.images.length; i++) {
      const imgUrl = extracted.images[i];
      try {
        const suffix = i === 0 ? "" : `-${i + 1}`;
        // Detect extension from URL; default to webp for MakerWorld CDN images
        const extMatch = imgUrl.match(/\.(gif|png|jpe?g|webp)(\?|$)/i);
        const ext = extMatch ? extMatch[1].toLowerCase().replace('jpeg', 'jpg') : 'webp';
        const fileName = `${productSlug}${suffix}.${ext}`;

        const imgRes = await page.request.get(imgUrl);
        if (imgRes.ok()) {
          const rawBuffer = await imgRes.body();
          const publicUrl = await compressAndUpload(rawBuffer, fileName, outputDir);
          localImages.push(publicUrl);
          console.log(`[Scraper] ✅ Uploaded image ${i + 1}: ${fileName} → ${publicUrl}`);
        }
      } catch (imgErr) {
        console.warn(`[Scraper] Failed to download image ${i + 1}:`, imgErr);
      }
    }

    // ---- Determine category from tags ----
    const allText = `${extracted.title} ${extracted.tags.join(" ")}`.toLowerCase();
    const category = detectCategory(allText);

    // ---- Estimate weight from print time if not found ----
    let weightGrams = 0;
    if (extracted.printProfile.weight) {
      weightGrams = parseFloat(extracted.printProfile.weight) || 0;
    }
    if (!weightGrams && extracted.printProfile.printTime) {
      // Rough estimate: ~12g per hour of print time
      const hMatch = extracted.printProfile.printTime.match(/(\d+)h/);
      const mMatch = extracted.printProfile.printTime.match(/(\d+)m/);
      const hours = (hMatch ? parseInt(hMatch[1]) : 0) + (mMatch ? parseInt(mMatch[1]) / 60 : 0);
      weightGrams = Math.round(hours * 12);
    }
    if (!weightGrams) weightGrams = 50;

    return {
      title: extracted.title || "MakerWorld Model",
      description: extracted.description || "",
      tags: extracted.tags,
      category,
      likes: extracted.likes,
      downloads: extracted.downloads,
      designerName: extracted.designerName,
      makerWorldUrl: url,
      images: extracted.images,
      localImages,
      printProfile: extracted.printProfile,
      dimensions: extracted.dimensions,
      scrapedAt: new Date().toISOString(),
    };
  } finally {
    if (page) await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
