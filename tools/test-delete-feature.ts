/**
 * tools/test-delete-feature.ts
 *
 * Integration test to verify that the product delete feature works end-to-end:
 * 1. Uploads a dummy image to R2 using /api/upload-image
 * 2. Adds a test product referencing that image using /api/save-products
 * 3. Verifies that the product exists in Supabase and the image exists in R2
 * 4. Deletes the product using DELETE /api/products/:id
 * 5. Verifies that the product is gone from Supabase
 * 6. Verifies that the image is gone from R2
 *
 * Run with:
 *   npx tsx tools/test-delete-feature.ts
 */

import { createClient } from "@supabase/supabase-js";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "blv-admin-secret-dev-001";
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function checkR2FileExists(key: string): Promise<boolean> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: key,
    });
    const response = await r2Client.send(command);
    if (response.Contents) {
      return response.Contents.some((item) => item.Key === key);
    }
    return false;
  } catch (err) {
    console.error(`Error checking key ${key} in R2:`, err);
    return false;
  }
}

async function runTest() {
  console.log("🧪 Starting End-to-End Delete Feature Verification Test...");

  const testProductId = "test-verification-product-999";
  const dummyFilename = "delete_verification_dummy_image.png";
  
  // 1x1 transparent PNG in base64
  const dummyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

  console.log("1. Uploading dummy test image...");
  const uploadRes = await fetch("http://localhost:3000/api/upload-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_SECRET_KEY,
    },
    body: JSON.stringify({
      fileName: dummyFilename,
      base64Data: dummyBase64,
      directory: "products",
    }),
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
  }

  const uploadData = await uploadRes.json() as { success: boolean; imagePath: string };
  console.log(`   Image uploaded successfully to: ${uploadData.imagePath}`);

  // Deduce the R2 object key
  const r2Key = `images/products/${dummyFilename}`;
  
  console.log("2. Verifying the image was uploaded to R2...");
  const imageExistsBefore = await checkR2FileExists(r2Key);
  if (!imageExistsBefore) {
    throw new Error(`Uploaded image not found in R2 bucket at key: ${r2Key}`);
  }
  console.log("   ✅ Confirmed: Image exists in R2.");

  console.log("3. Creating the test product referencing this image...");
  const testProduct = {
    id: testProductId,
    title: "Delete Verification Product",
    category: "Keychains",
    price: 1200,
    weightGrams: 15,
    filamentUsage: 11.2,
    description: "Temporary test product to verify delete functionality",
    images: [uploadData.imagePath],
    colors: ["matte-black"],
    materials: ["PLA"],
    tags: ["test"],
    printTimeMinutes: 45,
    rating: 5.0,
    reviewsCount: 0,
    reviews: [],
    makerWorldUrl: "",
    dimensions: "30mm x 30mm x 5mm",
  };

  const saveRes = await fetch("http://localhost:3000/api/save-products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_SECRET_KEY,
    },
    body: JSON.stringify([testProduct]),
  });

  if (!saveRes.ok) {
    throw new Error(`Save product failed: ${saveRes.status} ${await saveRes.text()}`);
  }

  console.log("   ✅ Confirmed: Product created and saved.");

  console.log("4. Verifying product presence in Supabase database...");
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: dbProduct, error: selectErr } = await supabase
    .from("products")
    .select("*")
    .eq("id", testProductId)
    .single();

  if (selectErr || !dbProduct) {
    throw new Error(`Failed to find product ${testProductId} in Supabase: ${selectErr?.message}`);
  }
  console.log(`   ✅ Confirmed: Product found in Supabase with title: "${dbProduct.title}"`);

  console.log("5. Triggering DELETE /api/products/:id for our test product...");
  const deleteRes = await fetch(`http://localhost:3000/api/products/${testProductId}`, {
    method: "DELETE",
    headers: {
      "x-admin-key": ADMIN_SECRET_KEY,
    },
  });

  if (!deleteRes.ok) {
    throw new Error(`DELETE request failed: ${deleteRes.status} ${await deleteRes.text()}`);
  }

  const deleteData = await deleteRes.json() as { success: boolean; message: string };
  console.log(`   Delete response:`, deleteData);

  console.log("6. Verifying product is deleted from Supabase database...");
  const { data: dbProductAfter, error: selectErrAfter } = await supabase
    .from("products")
    .select("*")
    .eq("id", testProductId)
    .single();

  // PGRST116 is code for 'no rows returned'
  if (selectErrAfter && selectErrAfter.code === "PGRST116") {
    console.log("   ✅ Confirmed: Product is gone from Supabase (PGRST116 successfully received).");
  } else if (dbProductAfter) {
    throw new Error(`Product ${testProductId} still exists in Supabase database!`);
  } else {
    throw new Error(`Unexpected Supabase fetch result: ${selectErrAfter?.message}`);
  }

  console.log("7. Verifying R2 image was deleted...");
  const imageExistsAfter = await checkR2FileExists(r2Key);
  if (imageExistsAfter) {
    throw new Error(`Image ${r2Key} still exists in R2 bucket after product deletion!`);
  }
  console.log("   ✅ Confirmed: Associated image was deleted from R2.");

  console.log("8. Verifying public/data/products.json file does not contain the product...");
  const dbPath = path.join(process.cwd(), "public", "data", "products.json");
  if (fs.existsSync(dbPath)) {
    const raw = fs.readFileSync(dbPath, "utf-8");
    const products = JSON.parse(raw) as any[];
    const found = products.find((p) => p.id === testProductId);
    if (found) {
      throw new Error(`Product ${testProductId} still exists in public/data/products.json!`);
    }
  }
  console.log("   ✅ Confirmed: Local products.json does not contain the product.");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
  console.log("The product delete feature deleted the database row and cleaned up R2 images perfectly.");
}

runTest().catch((err) => {
  console.error("\n❌ TEST FAILED:", err.message || err);
  process.exit(1);
});
