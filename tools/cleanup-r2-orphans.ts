/**
 * tools/cleanup-r2-orphans.ts
 *
 * Compares files in the Cloudflare R2 bucket under `images/products/` against
 * images referenced by active products in Supabase (or local fallback).
 * Any unreferenced files in that path are deleted from R2.
 *
 * Usage:
 *   npx tsx tools/cleanup-r2-orphans.ts
 */

import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

// ── Configuration ────────────────────────────────────────────────────────────
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

const LOCAL_DB_PATH = path.join(process.cwd(), "public", "data", "products.json");

// Initialize S3 / R2 client
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normalise the images field — Supabase JSONB can arrive as string or array. */
function parseImages(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
}

/** Lists all keys in the R2 bucket under a given prefix. */
async function listR2Objects(bucketName: string, prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined = undefined;

  do {
    const command: ListObjectsV2Command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    const response = await r2Client.send(command);
    if (response.Contents) {
      for (const item of response.Contents) {
        if (item.Key) {
          keys.push(item.Key);
        }
      }
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return keys;
}

/** Deletes a batch of keys from R2. Up to 1000 keys per request. */
async function deleteR2Objects(bucketName: string, keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  // S3 DeleteObjectsCommand allows up to 1000 keys
  const limit = 1000;
  for (let i = 0; i < keys.length; i += limit) {
    const batch = keys.slice(i, i + limit);
    const command = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: batch.map((k) => ({ Key: k })),
        Quiet: true,
      },
    });
    await r2Client.send(command);
    console.log(`[R2] Deleted batch of ${batch.length} object(s)...`);
  }
}

// ── Main Execution ────────────────────────────────────────────────────────────

async function run() {
  console.log("🧼 Starting R2 Orphan Image Cleanup Workstation...");

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.error("❌ Missing Cloudflare R2 Credentials in environmental variables.");
    process.exit(1);
  }

  // 1. Get referenced images from database
  let referencedKeysSet = new Set<string>();
  let products: any[] = [];

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    console.log("🗄️ Fetching active product images from Supabase...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.from("products").select("id, title, images");
    if (error) {
      throw new Error(`Supabase select failed: ${error.message}`);
    }
    products = data || [];
    console.log(`   Found ${products.length} products in Supabase.`);
  } else {
    console.warn("⚠️ Supabase credentials missing. Reading local products.json instead...");
    if (fs.existsSync(LOCAL_DB_PATH)) {
      products = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf-8"));
      console.log(`   Found ${products.length} products in local products.json.`);
    } else {
      console.error("❌ Local products.json fallback not found. Cannot determine referenced images.");
      process.exit(1);
    }
  }

  // Parse product images and map to exact R2 keys as they appear in the database URLs
  for (const product of products) {
    const images = parseImages(product.images);
    for (const url of images) {
      if (url && (url.includes("r2.dev") || url.includes("cloudflarestorage.com") || url.startsWith("http"))) {
        // Extract the key portion of the URL (everything after the domain name)
        // e.g. https://pub-xxx.r2.dev/images/products/file.png -> images/products/file.png
        // e.g. https://pub-xxx.r2.dev/belvia-file.png -> belvia-file.png
        try {
          const parsedUrl = new URL(url);
          const key = decodeURIComponent(parsedUrl.pathname.substring(1)); // strip leading slash
          if (key) {
            referencedKeysSet.add(key);
          }
        } catch (urlErr) {
          // Fallback if URL parsing fails: extract string after last slash
          const filename = url.substring(url.lastIndexOf("/") + 1);
          referencedKeysSet.add(filename);
        }
      }
    }
  }

  console.log(`   Extracted ${referencedKeysSet.size} unique referenced image key(s).`);

  // 2. List all objects in the bucket (prefix "")
  console.log("\n📦 Listing all objects in R2 bucket...");
  const allObjects = await listR2Objects(R2_BUCKET_NAME, "");
  console.log(`   Found ${allObjects.length} total file(s) in R2 bucket.`);

  // 3. Find orphans (only check product images, protect payment proofs)
  const orphans: string[] = [];
  const kept: string[] = [];
  const excluded: string[] = [];

  const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

  for (const key of allObjects) {
    const lowerKey = key.toLowerCase();
    const isImage = IMAGE_EXTENSIONS.some((ext) => lowerKey.endsWith(ext));

    // Protect payments, configurations, etc.
    const isProtected = lowerKey.startsWith("images/payments/") || 
                        lowerKey.includes("payment") || 
                        !isImage;

    if (isProtected) {
      excluded.push(key);
      continue;
    }

    if (referencedKeysSet.has(key)) {
      kept.push(key);
    } else {
      orphans.push(key);
    }
  }

  console.log(`\n🔍 Comparison complete:`);
  console.log(`   - Kept/Referenced : ${kept.length}`);
  console.log(`   - Orphans found   : ${orphans.length}`);
  console.log(`   - Protected/Skip  : ${excluded.length}`);

  // 4. Delete orphans from R2
  if (orphans.length > 0) {
    console.log(`\n🗑️ Deleting ${orphans.length} orphaned image(s) from R2...`);
    await deleteR2Objects(R2_BUCKET_NAME, orphans);
    console.log("✅ Deletion completed successfully.");
  } else {
    console.log("\n✨ No orphaned images detected. R2 bucket is clean!");
  }

  // 5. Final Report Summary
  console.log("\n" + "=".repeat(70));
  console.log("📋 CLEANUP SUMMARY");
  console.log("=".repeat(70));
  console.log(`  Total files in R2 bucket: ${allObjects.length}`);
  console.log(`  Active references kept  : ${kept.length}`);
  console.log(`  Orphaned files deleted  : ${orphans.length}`);
  console.log(`  Protected files skipped : ${excluded.length}`);
  console.log("=".repeat(70));
}

run().catch((err) => {
  console.error("Cleanup job failed:", err);
  process.exit(1);
});
