/**
 * tools/audit-missing-images.ts
 *
 * Audits every product in Supabase and HEAD-checks each image URL.
 * Broken (404 / network failure) URLs are flagged with a suggested action.
 * The report is saved to tools/missing-images-report.json.
 *
 * Usage:
 *   npx tsx tools/audit-missing-images.ts
 *
 * Safe to run at any time — read-only, nothing is deleted or modified.
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// ── Config ────────────────────────────────────────────────────────────────────
const REPORT_PATH = path.join(process.cwd(), "tools", "missing-images-report.json");
const DB_PATH = path.join(process.cwd(), "public", "data", "products.json");

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

// How many HEAD requests to fire concurrently (avoid rate-limiting)
const CONCURRENCY = 8;

// ── Types ─────────────────────────────────────────────────────────────────────
interface BrokenImage {
  url: string;
  statusCode: number | null; // null means network/DNS failure
  reason: string;
  suggestedAction: "re-upload" | "remove-from-array";
}

interface ProductReport {
  productId: string;
  productName: string;
  totalImages: number;
  brokenImages: BrokenImage[];
}

interface AuditReport {
  generatedAt: string;
  totalProductsChecked: number;
  totalImagesChecked: number;
  totalBrokenImages: number;
  productsWithBrokenImages: number;
  products: ProductReport[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns { ok, status } for a given URL — never throws. */
async function headCheck(url: string): Promise<{ ok: boolean; status: number | null; reason: string }> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      // Short timeout: 8 seconds is enough for a CDN HEAD check
      signal: AbortSignal.timeout(8000),
    });
    return {
      ok: res.ok,
      status: res.status,
      reason: res.ok ? "OK" : `HTTP ${res.status} ${res.statusText}`,
    };
  } catch (err: any) {
    return { ok: false, status: null, reason: err.message || "Network failure" };
  }
}

/** Runs promises in batches of `size` concurrently. */
async function pMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((item, j) => fn(item, i + j)));
    results.push(...batchResults);
  }
  return results;
}

/** Normalise the images field — Supabase JSONB can arrive as string or array. */
function parseImages(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  // 1. Load products (Supabase first, local JSON fallback)
  let products: any[] = [];

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log("🗄️  Fetching products from Supabase...");
    const { data, error } = await supabase.from("products").select("id, title, images");
    if (error) throw new Error(`Supabase fetch failed: ${error.message}`);
    products = data || [];
    console.log(`   Found ${products.length} products in Supabase.\n`);
  } else {
    console.warn("⚠️  Supabase env vars not set — falling back to local products.json");
    if (!fs.existsSync(DB_PATH)) {
      console.error(`Local DB not found at ${DB_PATH}. Aborting.`);
      process.exit(1);
    }
    products = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    console.log(`   Found ${products.length} products in local DB.\n`);
  }

  if (products.length === 0) {
    console.log("No products found. Nothing to audit.");
    process.exit(0);
  }

  // 2. Build the full list of (product, url) pairs to check
  const checks: Array<{ product: any; url: string }> = [];
  for (const product of products) {
    const images = parseImages(product.images);
    for (const url of images) {
      if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
        checks.push({ product, url });
      }
      // Skip relative paths — they can't be HEAD-checked remotely
    }
  }

  console.log(`🔍 Checking ${checks.length} image URL(s) across ${products.length} product(s)...`);
  console.log(`   Concurrency: ${CONCURRENCY} parallel HEAD requests\n`);

  // 3. Run HEAD checks concurrently
  let done = 0;
  const checkResults = await pMap(
    checks,
    async ({ product, url }) => {
      const result = await headCheck(url);
      done++;
      if (!result.ok) {
        process.stdout.write(`   ❌ [${done}/${checks.length}] ${result.reason.padEnd(30)} → ${url}\n`);
      } else {
        process.stdout.write(`   ✅ [${done}/${checks.length}] OK → ${url.slice(0, 70)}\n`);
      }
      return { product, url, ...result };
    },
    CONCURRENCY
  );

  // 4. Build report grouped by product
  const productMap = new Map<string, ProductReport>();

  for (const product of products) {
    const images = parseImages(product.images);
    productMap.set(product.id, {
      productId: product.id,
      productName: product.title || "(no title)",
      totalImages: images.length,
      brokenImages: [],
    });
  }

  for (const result of checkResults) {
    if (!result.ok) {
      const entry = productMap.get(result.product.id);
      if (entry) {
        entry.brokenImages.push({
          url: result.url,
          statusCode: result.status,
          reason: result.reason,
          // 404 = file never uploaded → re-upload
          // Other failures (5xx, network) → might be transient, suggest re-upload
          // If URL looks totally malformed → suggest removing from array
          suggestedAction: result.url.includes("r2.cloudflarestorage.com") ||
            result.url.includes("r2.dev") ||
            result.url.startsWith("https://")
            ? "re-upload"
            : "remove-from-array",
        });
      }
    }
  }

  // 5. Filter to only products that have at least one broken image
  const brokenProducts = [...productMap.values()].filter(p => p.brokenImages.length > 0);
  const totalBroken = brokenProducts.reduce((sum, p) => sum + p.brokenImages.length, 0);

  // 6. Build final report
  const report: AuditReport = {
    generatedAt: new Date().toISOString(),
    totalProductsChecked: products.length,
    totalImagesChecked: checks.length,
    totalBrokenImages: totalBroken,
    productsWithBrokenImages: brokenProducts.length,
    products: brokenProducts,
  };

  // 7. Save to disk
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf-8");

  // 8. Print summary
  console.log("\n" + "=".repeat(70));
  console.log("📋  AUDIT SUMMARY");
  console.log("=".repeat(70));
  console.log(`  Products checked   : ${report.totalProductsChecked}`);
  console.log(`  Images checked     : ${report.totalImagesChecked}`);
  console.log(`  Broken images      : ${report.totalBrokenImages}`);
  console.log(`  Affected products  : ${report.productsWithBrokenImages}`);
  console.log("=".repeat(70));

  if (brokenProducts.length === 0) {
    console.log("\n✅ All images are reachable. No action needed.");
  } else {
    console.log("\n❌ Affected products:\n");
    for (const p of brokenProducts) {
      console.log(`  • ${p.productName} (${p.productId})`);
      for (const b of p.brokenImages) {
        console.log(`      ${b.statusCode ?? "ERR"} — ${b.suggestedAction.toUpperCase()}`);
        console.log(`      ${b.url}`);
      }
    }
    console.log(`\n📄 Full report saved to: ${REPORT_PATH}`);
    console.log('\nNext steps:');
    console.log('  • For "re-upload"     → upload a new image via admin and update the product');
    console.log('  • For "remove-from-array" → edit the product in admin and delete the broken URL');
  }
}

run().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
